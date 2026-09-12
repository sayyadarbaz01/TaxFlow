import { test, expect } from "@playwright/test";

test.describe("Authentication Journey", () => {
  test("should allow SuperAdmin to login and view dashboard", async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.fill('input[type="email"]', "superadmin@taxflow.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator("h2:has-text('WORKSPACE')")).toBeVisible();
  });
});
