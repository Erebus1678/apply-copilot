import { test, expect } from "@playwright/test";

// No network mock: this proves the checked-in fixture streams end-to-end through
// the real route/response pipeline, not a parallel fake renderer.

test("demo mode streams the fixture analysis with no API key", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /try the live demo/i }).click();

  await expect(page).toHaveURL(/\/analyze\?demo=1$/);
  await expect(page.getByRole("img", { name: /cv fit score: 82 out of 100/i })).toBeVisible();
  await expect(
    page.getByText("Strong match: deep React/TypeScript experience with only a minor GraphQL gap."),
  ).toBeVisible();
});
