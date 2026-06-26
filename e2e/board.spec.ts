import { test, expect } from "@playwright/test";

// Exercises the board against the embedded PGlite DB (no external services).
// Self-cleaning: each run uses a unique role and deletes what it creates.
test("create, restage, and delete an application", async ({ page }) => {
  const stamp = Date.now();
  const company = `E2E Co ${stamp}`;
  const role = `E2E Engineer ${stamp}`;

  await page.goto("/board");
  // Wait for the default profile to resolve so writes are scoped to it.
  await expect(page.getByRole("button", { name: "Personal" })).toBeVisible();

  await page.getByLabel("Company").fill(company);
  await page.getByLabel(/^role$/i).fill(role);
  await page.getByRole("button", { name: /^add$/i }).click();

  await expect(page.getByText(role, { exact: true })).toBeVisible();

  // Move it to the interview stage.
  const status = page.getByLabel(`Status for ${role}`);
  await status.selectOption("interview");
  await expect(status).toHaveValue("interview");

  // Delete it and confirm it's gone.
  await page.getByRole("button", { name: `Delete ${role} at ${company}` }).click();
  await expect(page.getByText(role, { exact: true })).toHaveCount(0);
});

test("imports applications from a JSON file into the board", async ({ page }) => {
  const stamp = Date.now();
  const company = `Imported Co ${stamp}`;
  const role = `Imported Role ${stamp}`;
  await page.goto("/board");
  // Wait for the default profile to resolve so the import is scoped to it.
  await expect(page.getByRole("button", { name: "Personal" })).toBeVisible();

  await page.getByLabel(/import applications/i).setInputFiles({
    name: "jobs.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify([{ company, role }])),
  });

  await expect(page.getByRole("status")).toContainText(/imported 1/i);
  await expect(page.getByText(role, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Delete ${role} at ${company}` }).click();
  await expect(page.getByText(role, { exact: true })).toHaveCount(0);
});
