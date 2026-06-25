import { test, expect } from "@playwright/test";

test("home page loads with headline and CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /start with a job description/i })).toBeVisible();
});
