import { test, expect } from "@playwright/test";

test("Live Demonstration: Add Lead Client Step-by-Step with Visible Typing", async ({ page }) => {
  test.setTimeout(180000); // 3 minutes timeout for visible human-paced demonstration

  // 1. Open the Login Page
  console.log("\n▶ Step 1: Navigating to login page...");
  await page.goto("http://localhost:3000/login");
  await page.waitForTimeout(1200);

  // 2. Type credentials one by one
  console.log("▶ Step 2: Typing email address character-by-character...");
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill("");
  await emailInput.pressSequentially("superadmin@taxflow.com", { delay: 40 });
  await page.waitForTimeout(400);

  console.log("▶ Step 3: Typing password character-by-character...");
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill("");
  await passwordInput.pressSequentially("Password123!", { delay: 40 });
  await page.waitForTimeout(400);

  console.log("▶ Step 4: Clicking Sign In with Email...");
  await page.click("button:has-text('Sign In with Email')");
  await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
  await page.waitForTimeout(2000);

  // 3. Navigate to Lead Clients tab in the sidebar
  console.log("▶ Step 5: Clicking 'Lead Clients' under WORKSPACE in the sidebar...");
  await page.click('aside a[href="/leads"]');
  await expect(page).toHaveURL(/.*\/leads/);
  await page.waitForTimeout(1800);

  // 4. Click 'Add Lead Client' button
  console.log("▶ Step 6: Opening 'Add Lead Client' modal...");
  await page.click("button:has-text('Add Lead Client')");
  const modal = page.locator(".fixed.inset-0");
  await expect(page.locator("text=Add New Lead Client")).toBeVisible();
  await page.waitForTimeout(1500);

  // 5. Type Lead Legal Name character by character
  const testName = `Apex Global Innovations ${Math.floor(100 + Math.random() * 900)} LLP`;
  console.log(`▶ Step 7: Typing Lead Legal Name: "${testName}"...`);
  const nameInput = modal.locator('input[placeholder*="Apex Logistics"]');
  await nameInput.click();
  await nameInput.fill("");
  await nameInput.pressSequentially(testName, { delay: 70 });
  await page.waitForTimeout(1000);

  // 6. Select Entity Structure
  console.log("▶ Step 8: Selecting Entity Structure dropdown: LLP...");
  const entitySelect = modal.locator("select").nth(0);
  await entitySelect.selectOption("LLP");
  await page.waitForTimeout(1000);

  // 7. Check 'Provisional Lead (No PAN yet)'
  console.log("▶ Step 9: Checking 'Provisional Lead (No PAN yet)' toggle (auto-generates compliant PAN)...");
  const provisionalCheckbox = modal.locator('input[type="checkbox"]');
  await provisionalCheckbox.check();
  await page.waitForTimeout(1200);

  // 8. Type Primary Phone digit by digit
  console.log("▶ Step 10: Typing Primary Contact Phone digit by digit...");
  const phoneInput = modal.locator('input[placeholder*="10 digit mobile number"]');
  await phoneInput.click();
  await phoneInput.fill("");
  await phoneInput.pressSequentially("9876543210", { delay: 80 });
  await page.waitForTimeout(1000);

  // 9. Type Contact Email character by character
  console.log("▶ Step 11: Typing Contact Email character by character...");
  const emailField = modal.locator('input[placeholder*="contact@prospect.com"]');
  await emailField.click();
  await emailField.fill("");
  await emailField.pressSequentially("director@apexinnovations.in", { delay: 60 });
  await page.waitForTimeout(1000);

  // 10. Select Service Scope: ITR + GST Combined Retainer
  console.log("▶ Step 12: Selecting Scope of Work: 'ITR + GST Combined Retainer'...");
  const scopeSelect = modal.locator("select").nth(1);
  await scopeSelect.selectOption("ITR + GST");
  await page.waitForTimeout(1200);

  // 11. Click Create Lead Client
  console.log("▶ Step 13: Submitting lead intake form ('Create Lead Client')...");
  await modal.locator("button:has-text('Create Lead Client')").click();
  await page.waitForTimeout(2000);

  // 12. Verify in Lead Table
  console.log("▶ Step 14: Verifying lead is visible in Lead Clients pipeline table...");
  const leadRow = page.locator(`tr:has-text("${testName}")`);
  await expect(leadRow).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2500);

  // 13. Navigate to Clients CRM to verify cross-visibility
  console.log("▶ Step 15: Navigating to 'Clients' tab to verify cross-visibility in main CRM...");
  await page.click('aside a[href="/clients"]');
  await expect(page).toHaveURL(/.*\/clients/);
  await page.waitForTimeout(2000);

  console.log("▶ Step 16: Verifying the lead also appears in the main Clients CRM table...");
  const clientRow = page.locator(`tr:has-text("${testName}")`);
  await expect(clientRow).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2500);

  // 14. Convert Lead to Active Client
  console.log("▶ Step 17: Clicking green 'Convert' button to promote lead to Active Client...");
  const convertBtn = clientRow.locator("button:has-text('Convert')");
  await convertBtn.click();
  await page.waitForTimeout(2000);

  // Verify Active status badge
  await expect(convertBtn).not.toBeVisible({ timeout: 15000 });
  await expect(clientRow.getByText("ACTIVE", { exact: false })).toBeVisible({ timeout: 15000 });
  console.log("✔ Lead successfully converted to Active Client with statutory filings generated!");
  await page.waitForTimeout(3000);

  // 15. Clean up by deleting the test client
  console.log("▶ Step 18: Cleaning up test client via Delete confirmation modal...");
  const deleteBtn = clientRow.locator("button:has-text('Delete')");
  await deleteBtn.click();
  await page.waitForTimeout(1000);
  await expect(page.locator("text=Delete Client Confirmation")).toBeVisible();
  await page.waitForTimeout(1000);
  await page.click("button:has-text('Delete Client')");
  await expect(page.locator("text=Delete Client Confirmation")).not.toBeVisible({ timeout: 15000 });
  await expect(page.locator("tbody").getByText(testName)).not.toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2000);

  console.log("✔ Live demonstration complete! Cleaned up successfully.\n");
});
