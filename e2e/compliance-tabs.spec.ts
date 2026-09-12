import { test, expect } from "@playwright/test";

test.describe("Compliance Modules: Tax Audit & GST Registration", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Log in
    await page.goto("http://localhost:3000/login");
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill("superadmin@taxflow.com");
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill("Password123!");
    await page.click("button:has-text('Sign In with Email')");
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
  });

  test("1. Sidebar COMPLIANCE group should display Tax Audit and GST Registration tabs", async ({ page }) => {
    const complianceNav = page.locator('aside');
    await expect(complianceNav.getByRole("link", { name: "ITR Filings" })).toBeVisible();
    await expect(complianceNav.getByRole("link", { name: "GST Returns" })).toBeVisible();
    await expect(complianceNav.getByRole("link", { name: "Tax Audit" })).toBeVisible();
    await expect(complianceNav.getByRole("link", { name: "GST Registration" })).toBeVisible();
    await expect(complianceNav.getByRole("link", { name: "TDS / TCS" })).toBeVisible();
  });

  test("2. Tax Audit tab should display Section 44AB center, KPIs, and modals", async ({ page }) => {
    await page.click('aside a[href="/tax-audit"]');
    await expect(page).toHaveURL(/.*\/tax-audit/);

    // Verify Title and Badge
    await expect(page.locator("h1:has-text('Section 44AB Tax Audit Center')")).toBeVisible();
    await expect(page.locator("text=Form 3CA / 3CB / 3CD")).toBeVisible();

    // Verify KPI Cards
    await expect(page.locator("text=Total Audit Engagements")).toBeVisible();
    await expect(page.locator("text=Form 3CA / 3CD (Corporate)")).toBeVisible();
    await expect(page.locator("text=Form 3CB / 3CD (Non-Corp)")).toBeVisible();
    await expect(page.locator("text=Pending UDIN / Filing")).toBeVisible();

    // Verify Statutory Due Date Banner
    await expect(page.locator("text=Statutory Deadlines: Tax Audit Report & Return Filing (AY 2026-27)")).toBeVisible();

    // Open "New Audit Engagement" modal
    await page.click("button:has-text('New Audit Engagement')");
    await expect(page.locator("text=Initiate Section 44AB Tax Audit Engagement")).toBeVisible();
    await expect(page.locator("text=Audit Form Type")).toBeVisible();
    await page.click("button:has-text('Cancel')");
    await expect(page.locator("text=Initiate Section 44AB Tax Audit Engagement")).not.toBeVisible();
  });

  test("3. GST Registration tab should display pipeline, KPIs, and create application", async ({ page }) => {
    await page.click('aside a[href="/gst-registration"]');
    await expect(page).toHaveURL(/.*\/gst-registration/);

    // Verify Title and Badge
    await expect(page.locator("h1:has-text('GST Registration Center')")).toBeVisible();
    await expect(page.locator("text=Form GST REG-01")).toBeVisible();

    // Verify KPI Cards
    await expect(page.locator("text=Active Applications")).toBeVisible();
    await expect(page.locator("text=TRN Drafts (Part A)")).toBeVisible();
    await expect(page.locator("text=ARN Submitted (Part B)")).toBeVisible();
    await expect(page.locator("text=Certificates Issued (REG-06)")).toBeVisible();

    // Open "New GST Registration" modal
    await page.click("button:has-text('New GST Registration')");
    await expect(page.locator("text=New GST Registration Application (Form GST REG-01)")).toBeVisible();

    // Fill form
    const uniqueNum = Math.floor(100 + Math.random() * 900);
    const testBusinessName = `Apex Global Ventures ${uniqueNum} LLP`;
    await page.locator('input[placeholder*="Zenith Logix Solutions"]').fill(testBusinessName);
    await page.locator('input[placeholder="ABCDE1234F"]').fill("AABCA1234F");
    await page.locator('input[placeholder*="10 digit mobile number"]').fill("9876543210");
    await page.locator('input[placeholder="accounts@business.in"]').fill("director@apexventures.in");

    // Submit
    await page.click("button:has-text('Create GST Registration')");
    await expect(page.locator("text=New GST Registration Application (Form GST REG-01)")).not.toBeVisible({ timeout: 10000 });

    // Verify new registration is visible in table
    const appRow = page.locator(`tr:has-text("${testBusinessName}")`);
    await expect(appRow).toBeVisible({ timeout: 15000 });
    await expect(appRow.getByText(/trn generated/i)).toBeVisible({ timeout: 15000 });

    // Test Stepper Inspector
    await appRow.locator("button:has-text('Stepper')").click();
    await expect(page.locator("text=TRN Part A")).toBeVisible();

    // Test Advance Stage to ARN_SUBMITTED
    await appRow.locator("button:has-text('Advance')").click();
    await expect(page.locator("text=Advance GST Registration:")).toBeVisible();
    await page.click("button:has-text('Confirm Advance Stage')");
    await expect(page.locator("text=Advance GST Registration:")).not.toBeVisible({ timeout: 10000 });
    await expect(appRow.getByText(/arn submitted/i)).toBeVisible({ timeout: 15000 });
  });
});
