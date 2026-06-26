import { test, expect } from "@playwright/test";

const routes = [
  { label: "CV check", heading: /is your cv ats-ready/i, path: /\/cv$/ },
  { label: "Analyze", heading: /analyze a job description/i, path: /\/analyze$/ },
  { label: "Cover letter", heading: /draft a cover letter/i, path: /\/cover-letter$/ },
  { label: "Job Tracker", heading: /your job tracker/i, path: /\/board$/ },
  { label: "Stats", heading: /your application stats/i, path: /\/stats$/ },
];

test("main nav lists the workflow with the CV check first", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  const labels = await nav.getByRole("link").allInnerTexts();
  const cv = labels.findIndex((t) => t.includes("CV check"));
  const analyze = labels.findIndex((t) => t.includes("Analyze"));
  expect(cv).toBeGreaterThan(-1);
  expect(analyze).toBeGreaterThan(-1);
  expect(cv).toBeLessThan(analyze); // CV check precedes Analyze
});

for (const { label, heading, path } of routes) {
  test(`nav → ${label} opens its page`, async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  });
}
