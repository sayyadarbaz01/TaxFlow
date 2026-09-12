import { test, expect } from "@playwright/test";

test.describe("Workspace Navigation & Module Functionality", () => {
  // Common authentication setup before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await expect(page.locator("button[type='submit']")).toBeVisible({ timeout: 15000 });

    await page.fill('input[type="email"]', "superadmin@taxflow.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click("button[type='submit']");

    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
  });

  test("1. Workspace sidebar links should be visible and ordered correctly", async ({ page }) => {
    const workspaceHeading = page.locator("h2:has-text('WORKSPACE')");
    await expect(workspaceHeading).toBeVisible();

    const dashboardLink = page.locator('aside a[href="/dashboard"]');
    const clientsLink = page.locator('aside a[href="/clients"]');
    const leadClientsLink = page.locator('aside a[href="/leads"]');
    const documentsLink = page.locator('aside a[href="/documents"]');

    await expect(dashboardLink).toBeVisible();
    await expect(dashboardLink).toContainText("Dashboard");

    await expect(clientsLink).toBeVisible();
    await expect(clientsLink).toContainText("Clients");

    await expect(leadClientsLink).toBeVisible();
    await expect(leadClientsLink).toContainText("Lead Clients");

    await expect(documentsLink).toBeVisible();
    await expect(documentsLink).toContainText("Documents");
  });

  test("2. Dashboard tab should display KPI metrics and live task widgets", async ({ page }) => {
    await page.click('aside a[href="/dashboard"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Verify presence of live task and activity components
    const taskSection = page.locator("text=Live Task Dashboard");
    const activitySection = page.locator("text=Weekly Activity");

    await expect(taskSection).toBeVisible();
    await expect(activitySection).toBeVisible();
  });

  test("3. Clients tab should allow status filtering and search", async ({ page }) => {
    await page.click('aside a[href="/clients"]');
    await expect(page).toHaveURL(/.*\/clients/);
    await expect(page.locator("h1:has-text('Client Management CRM')")).toBeVisible();

    // Verify status filter segmented buttons
    const allClientsTab = page.getByRole("button", { name: "All Clients", exact: true });
    const activeTab = page.getByRole("button", { name: "Active", exact: true });
    const leadClientsTab = page.getByRole("button", { name: "Lead Clients", exact: true });
    const onboardingTab = page.getByRole("button", { name: "Onboarding", exact: true });

    await expect(allClientsTab).toBeVisible();
    await expect(activeTab).toBeVisible();
    await expect(leadClientsTab).toBeVisible();
    await expect(onboardingTab).toBeVisible();

    // Test clicking Lead Clients filter pill
    await leadClientsTab.click();

    // Return to All Clients
    await allClientsTab.click();

    // Verify search input
    const searchInput = page.locator('input[placeholder*="Filter clients by name"]');
    await expect(searchInput).toBeVisible();

    // Verify quick navigation button to Lead Clients Pipeline
    const pipelineBtn = page.getByRole("button", { name: "Lead Clients Pipeline" });
    await expect(pipelineBtn).toBeVisible();
  });

  test("4. Lead Clients tab should show pipeline metrics and Add Lead modal", async ({ page }) => {
    // Click Lead Clients in the sidebar
    await page.click('aside a[href="/leads"]');
    await expect(page).toHaveURL(/.*\/leads/);
    await expect(page.locator("h1:has-text('Lead Clients Pipeline')")).toBeVisible();

    // Verify lead metric highlight cards
    await expect(page.locator("text=Total Active Leads")).toBeVisible();
    await expect(page.locator("text=Direct Tax (ITR) Leads")).toBeVisible();
    await expect(page.locator("text=GST Returns Leads")).toBeVisible();
    await expect(page.locator("text=ITR + GST Packages")).toBeVisible();

    // Click Add Lead Client button
    const addLeadBtn = page.locator("button:has-text('Add Lead Client')");
    await expect(addLeadBtn).toBeVisible();
    await addLeadBtn.click();

    // Verify Add Lead modal is open
    const modalTitle = page.locator("text=Add New Lead Client");
    await expect(modalTitle).toBeVisible();

    // Check modal form fields
    await expect(page.locator('input[placeholder*="Apex Logistics"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="10 digit mobile number"]')).toBeVisible();

    // Test the provisional PAN checkbox toggle
    const provisionalCheckbox = page.locator('input[type="checkbox"]');
    await expect(provisionalCheckbox).toBeVisible();
    await provisionalCheckbox.check();
    await expect(provisionalCheckbox).toBeChecked();
    await provisionalCheckbox.uncheck();

    // Close the modal
    const cancelBtn = page.locator("button:has-text('Cancel')");
    await cancelBtn.click();
    await expect(modalTitle).not.toBeVisible();
  });

  test("5. Documents tab should load Document Vault & Checklist", async ({ page }) => {
    await page.click('aside a[href="/documents"]');
    await expect(page).toHaveURL(/.*\/documents/);
    await expect(page.locator("h1:has-text('Document Vault & Checklist')")).toBeVisible();
    await expect(page.locator("text=Upload Client Document")).toBeVisible();
  });

  test("6. Automated End-to-End: Type values, submit lead form, verify cross-visibility and convert to active", async ({ page }) => {
    // 1. Click Lead Clients in the sidebar
    await page.click('aside a[href="/leads"]');
    await expect(page).toHaveURL(/.*\/leads/);

    // 2. Open Add Lead Client modal
    await page.click("button:has-text('Add Lead Client')");
    const modal = page.locator(".fixed.inset-0");
    await expect(page.locator("text=Add New Lead Client")).toBeVisible();

    // 3. Automatically type in values into the form fields
    const testLeadName = `Apex Automations ${Math.floor(1000 + Math.random() * 9000)} LLP`;
    await page.fill('input[placeholder*="Apex Logistics"]', testLeadName);

    // Select Entity Structure: LLP
    const entitySelect = modal.locator("select").nth(0);
    await entitySelect.selectOption("LLP");

    // Toggle Provisional Lead (No PAN yet) so PAN is automatically generated
    await modal.locator('input[type="checkbox"]').check();

    // Fill Phone & Email
    await modal.locator('input[placeholder*="10 digit mobile number"]').fill("9876543210");
    await modal.locator('input[placeholder*="contact@prospect.com"]').fill("test@apexautomations.in");

    // Select Scope of Work: ITR + GST Combined Retainer
    const scopeSelect = modal.locator("select").nth(1);
    await scopeSelect.selectOption("ITR + GST");

    // 4. Click Create Lead Client button to submit
    await modal.locator("button:has-text('Create Lead Client')").click();

    // 5. Verify the new lead appears in the Lead Clients table
    await expect(page.locator(`text=${testLeadName}`)).toBeVisible({ timeout: 15000 });

    // 6. Cross-Visibility check: Navigate to Clients CRM
    await page.click('aside a[href="/clients"]');
    await expect(page).toHaveURL(/.*\/clients/);
    await expect(page.locator(`text=${testLeadName}`)).toBeVisible({ timeout: 15000 });

    // 7. Convert lead to active client
    const clientRow = page.locator(`tr:has-text("${testLeadName}")`);
    const convertBtn = clientRow.locator("button:has-text('Convert')");
    await convertBtn.click();

    // Verify status badge changed to Active and convert button disappears
    await expect(convertBtn).not.toBeVisible({ timeout: 15000 });
    await expect(clientRow.getByText("ACTIVE", { exact: false })).toBeVisible({ timeout: 15000 });

    // 8. Delete test client to keep database clean
    const deleteBtn = clientRow.locator("button:has-text('Delete')");
    await deleteBtn.click();
    await expect(page.locator("text=Delete Client Confirmation")).toBeVisible();
    await page.click("button:has-text('Delete Client')");
    await expect(page.locator("text=Delete Client Confirmation")).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator("tbody").getByText(testLeadName)).not.toBeVisible({ timeout: 15000 });
  });
});
