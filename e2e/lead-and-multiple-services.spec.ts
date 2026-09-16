import { test, expect } from "@playwright/test";

test.describe("Lead Client Intake & Multiple Independent Services End-to-End", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await expect(page.locator("button[type='submit']")).toBeVisible({ timeout: 15000 });

    await page.fill('input[type="email"]', "superadmin@taxflow.com");
    await page.fill('input[type="password"]', "Pass@123");
    await page.click("button[type='submit']");

    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
  });

  test("Flow: Create Lead without PAN -> Convert -> Add ITR (ITR-4) -> Add GST Return -> Add GST Registration", async ({ page }) => {
    const uniqueNum = Math.floor(1000 + Math.random() * 9000);
    const leadName = `Global Horizon Enterprises ${uniqueNum}`;

    // 1. Navigate to Leads page
    await page.click('aside a[href="/leads"]');
    await expect(page).toHaveURL(/.*\/leads/);

    // 2. Open Add Lead Modal
    await page.click("button:has-text('Add Lead Client')");
    await expect(page.locator("h3:has-text('Add New Lead Client')")).toBeVisible();

    // 3. Fill details WITHOUT PAN (PAN is optional for leads)
    await page.fill('input[placeholder*="Apex Logistics"]', leadName);
    await page.fill('input[placeholder*="10 digit mobile number"]', "9876501234");
    await page.fill('input[placeholder*="contact@prospect.com"]', `info@horizon${uniqueNum}.com`);

    // Verify PAN input is empty / optional
    const panInput = page.locator('input[placeholder*="ABCDE1234F (Can be added/updated later)"]');
    await expect(panInput).toHaveValue("");

    // Submit Lead
    await page.click("button:has-text('Create Lead Client')");
    await expect(page.locator("h3:has-text('Add New Lead Client')")).not.toBeVisible({ timeout: 15000 });

    // 4. Verify lead appears in table with "Not Provided (Optional)"
    const leadRow = page.locator(`tr:has-text("${leadName}")`);
    await expect(leadRow).toBeVisible({ timeout: 15000 });
    await expect(leadRow.getByText("Not Provided (Optional)")).toBeVisible();

    // 5. Convert lead to ACTIVE
    const convertBtn = leadRow.locator("button:has-text('Convert')");
    await convertBtn.click();

    // 6. Navigate to Clients CRM
    await page.click('aside a[href="/clients"]');
    await expect(page).toHaveURL(/.*\/clients/);

    // 7. Click on client row to open Client Detail Page
    const clientRow = page.locator(`tr:has-text("${leadName}")`);
    await expect(clientRow).toBeVisible({ timeout: 15000 });
    await clientRow.click();
    await expect(page).toHaveURL(/.*\/clients\/.+/);

    // 8. Click on "Services & Work Items" tab
    await page.click('button:has-text("Services & Work Items")');

    // 9. Add Service 1: Income Tax Return (ITR-4)
    await page.click("button:has-text('Add Service')");
    await expect(page.locator("h3:has-text('Add Client Service / Work Item')")).toBeVisible();

    // Select ITR-4
    await page.selectOption('select:has(option[value="ITR_4"])', "ITR_4");
    // Set fee
    await page.fill('input[type="number"]', "6500");
    await page.click("button:has-text('Add Independent Service')");
    await expect(page.locator("h3:has-text('Add Client Service / Work Item')")).not.toBeVisible({ timeout: 15000 });

    // Verify ITR service is visible
    await expect(page.locator("text=Income Tax Return (ITR-4)")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=₹6,500")).toBeVisible();

    // 10. Add Service 2: GST Return
    await page.click("button:has-text('Add Service')");
    await expect(page.locator("h3:has-text('Add Client Service / Work Item')")).toBeVisible();

    // Select Service Type: GST Return
    await page.selectOption('select:has(option[value="GST_RETURN"])', "GST_RETURN");
    // Set fee
    await page.fill('input[type="number"]', "3500");
    await page.click("button:has-text('Add Independent Service')");
    await expect(page.locator("h3:has-text('Add Client Service / Work Item')")).not.toBeVisible({ timeout: 15000 });

    // Verify GST Return service is visible alongside ITR
    await expect(page.locator("text=Income Tax Return (ITR-4)")).toBeVisible();
    await expect(page.locator("text=GST Return")).toBeVisible();
    await expect(page.locator("text=₹3,500")).toBeVisible();

    // 11. Add Service 3: GST Registration
    await page.click("button:has-text('Add Service')");
    await expect(page.locator("h3:has-text('Add Client Service / Work Item')")).toBeVisible();

    // Select Service Type: GST Registration
    await page.selectOption('select:has(option[value="GST_REGISTRATION"])', "GST_REGISTRATION");
    // Set fee
    await page.fill('input[type="number"]', "9000");
    await page.click("button:has-text('Add Independent Service')");
    await expect(page.locator("h3:has-text('Add Client Service / Work Item')")).not.toBeVisible({ timeout: 15000 });

    // 12. Verify all three services remain independent and none is overwritten
    await expect(page.locator("text=Income Tax Return (ITR-4)")).toBeVisible();
    await expect(page.locator("text=GST Return")).toBeVisible();
    await expect(page.locator("text=GST Registration")).toBeVisible();
    await expect(page.locator("text=3 Services")).toBeVisible();
  });
});
