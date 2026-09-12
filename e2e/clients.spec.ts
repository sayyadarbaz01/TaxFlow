import { test, expect } from "@playwright/test";

test.describe("Client Onboarding Journey", () => {
  test("should open client list and trigger onboarding wizard", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "superadmin@taxflow.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.click('aside a[href="/clients"]');
    await expect(page.locator("h1:has-text('Client Management CRM')")).toBeVisible();

    await page.click("button:has-text('Add Client')");
    await expect(page.locator("h3")).toContainText("Add New Client");
  });
});
