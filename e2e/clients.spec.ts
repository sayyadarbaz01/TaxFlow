import { test, expect } from "@playwright/test";

test.describe("Client CRM End-to-End Journey: Add, Edit, Delete", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await expect(page.locator("button[type='submit']")).toBeVisible({ timeout: 15000 });

    await page.fill('input[type="email"]', "superadmin@taxflow.com");
    await page.fill('input[type="password"]', "Pass@123");
    await page.click("button[type='submit']");

    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
  });

  test("Complete Client Lifecycle: Add New Client, Edit Details, and Delete Client", async ({ page }) => {
    const uniqueNum = Math.floor(1000 + Math.random() * 9000);
    const testClientName = `Alpha Star Enterprises ${uniqueNum} Pvt Ltd`;
    const chars = "BCDEFGHJKLMNPQRSTUVWXYZ";
    const r1 = chars[Math.floor(Math.random() * chars.length)];
    const r2 = chars[Math.floor(Math.random() * chars.length)];
    const testPan = `AA${r1}${r2}${uniqueNum}Z`;
    const testGstin = `27${testPan}1Z5`;

    // 1. Navigate to Clients CRM
    await page.click('aside a[href="/clients"]');
    await expect(page).toHaveURL(/.*\/clients/);
    await expect(page.locator("h1:has-text('Client Management CRM')")).toBeVisible();

    // 2. Open Add Client Onboarding Modal
    await page.click("button:has-text('Add Client')");
    await expect(page.locator("h3:has-text('Add New Client')")).toBeVisible();

    // STEP 1: Basic Info
    await page.fill('input[placeholder*="Acme Innovations"]', testClientName);
    await page.click("button:has-text('Continue')");

    // STEP 2: Tax Identifiers (PAN & GSTIN)
    await page.fill('input[placeholder*="ABCDE1234F"]', testPan);
    await page.fill('input[placeholder*="27ABCDE1234F1Z5"]', testGstin);
    await page.click("button:has-text('Continue')");

    // STEP 3: Contact Details (Phone & Email)
    await page.fill('input[placeholder*="98765 43210"]', "9876543210");
    await page.fill('input[placeholder*="accounts@acme.com"]', `accounts@alphastar${uniqueNum}.in`);
    await page.click("button:has-text('Continue')");

    // STEP 4: Scope of Work
    await page.click("button:has-text('Continue')");

    // STEP 5: Review & Submit
    await page.click("button:has-text('Complete Onboarding & Create Client')");

    // Wait for modal to close
    await expect(page.locator("h3:has-text('Add New Client')")).not.toBeVisible({ timeout: 15000 });

    // 3. Verify client appears in table
    const clientRow = page.locator(`tr:has-text("${testClientName}")`);
    await expect(clientRow).toBeVisible({ timeout: 15000 });
    await expect(clientRow.getByText(testPan)).toBeVisible();

    // 4. EDIT CLIENT: Modify Contact Phone & Name
    const editBtn = clientRow.locator("button:has-text('Edit')");
    await editBtn.click();
    await expect(page.locator("h3:has-text('Edit Client Details')")).toBeVisible();

    const updatedPhone = "+91 99999 88888";
    const phoneInput = page.locator('input[placeholder*="Contact phone number"], input[value*="9876543210"]');
    await phoneInput.fill(updatedPhone);

    await page.click("button:has-text('Save Changes')");
    await expect(page.locator("h3:has-text('Edit Client Details')")).not.toBeVisible({ timeout: 15000 });

    // Verify updated phone appears in table row
    await expect(clientRow.getByText(updatedPhone)).toBeVisible({ timeout: 15000 });

    // 5. DELETE CLIENT: Confirm Deletion and verify removal
    const deleteBtn = clientRow.locator("button:has-text('Delete')");
    await deleteBtn.click();
    await expect(page.locator("h3:has-text('Delete Client Confirmation')")).toBeVisible();

    await page.click("button:has-text('Delete Client')");
    await expect(page.locator("h3:has-text('Delete Client Confirmation')")).not.toBeVisible({ timeout: 15000 });

    // Verify row is no longer in table
    await expect(page.locator(`tbody tr:has-text("${testClientName}")`)).not.toBeVisible({ timeout: 15000 });
  });
});
