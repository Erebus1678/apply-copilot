import { test, expect } from "@playwright/test";

test("home page loads with headline and CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /start with a job description/i })).toBeVisible();
});

test("home CTA navigates to the analyze page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /start with a job description/i }).click();
  await expect(page).toHaveURL(/\/analyze$/);
  await expect(page.getByRole("heading", { name: /analyze a job description/i })).toBeVisible();
});
