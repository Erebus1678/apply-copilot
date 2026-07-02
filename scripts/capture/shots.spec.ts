import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { SHOTS, JD_ANALYZE, seedCv, registerMocks } from "./fixtures";

// One PNG per key screen for the README. AI is mocked in fixtures — deterministic,
// no live model, only synthetic data. Run via `pnpm capture`, not in CI.

mkdirSync(SHOTS, { recursive: true });

/** Scroll to the top for consistent framing, then screenshot the viewport. */
async function shoot(page: Page, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

test("capture screenshots", async ({ page }) => {
  await registerMocks(page);

  // Analyze: JD + CV in, fit score out.
  await page.goto("/analyze");
  await seedCv(page);
  await page.getByPlaceholder(/paste the full job description/i).fill(JD_ANALYZE);
  await page.getByRole("button", { name: /^analyze$/i }).click();
  await expect(page.getByRole("img", { name: /cv fit score: 82 out of 100/i })).toBeVisible();
  await shoot(page, "analyze");

  // CV review: ATS score + concrete fixes.
  await page.goto("/cv");
  await seedCv(page);
  await page.getByRole("button", { name: /check my cv/i }).click();
  await expect(
    page.getByRole("img", { name: /ats-friendliness score: 78 out of 100/i }),
  ).toBeVisible();
  await shoot(page, "cv-review");

  // Cover letter: streamed, editable draft.
  await page.goto("/cover-letter");
  await seedCv(page);
  await page.getByPlaceholder(/paste the job description/i).fill(JD_ANALYZE);
  await page.getByRole("button", { name: /draft letter/i }).click();
  await expect(page.getByLabel("Cover letter draft")).toHaveValue(/Dear Hiring Team/i);
  await shoot(page, "cover-letter");

  // Board: a populated pipeline across all five stages.
  await captureBoard(page);
});

const DEMO_APPS = [
  {
    company: "Vercel",
    role: "Senior Frontend Engineer",
    grade: "Senior",
    pay: "$160–190k",
    status: "interview",
  },
  {
    company: "Linear",
    role: "Product Engineer",
    grade: "Senior",
    pay: "$150–180k",
    status: "applied",
  },
  { company: "Stripe", role: "Frontend Engineer", grade: "L4", pay: "$170–200k", status: "saved" },
  { company: "Figma", role: "UI Engineer", grade: "Senior", pay: "$165–195k", status: "offer" },
  { company: "Notion", role: "Web Engineer", grade: "Mid", pay: "$140–170k", status: "rejected" },
] as const;

async function captureBoard(page: Page) {
  await page.goto("/board");
  // Cold dev-compile of /board + the profiles fetch can take a while on first hit.
  await expect(page.getByRole("button", { name: "Personal" })).toBeVisible({ timeout: 30_000 });

  // Idempotent: clear any rows a previous run left behind.
  for (const app of DEMO_APPS) {
    const del = page.getByRole("button", { name: `Delete ${app.role} at ${app.company}` });
    while (await del.count()) await del.first().click();
  }

  for (const app of DEMO_APPS) {
    await page.getByLabel("Company").fill(app.company);
    await page.getByLabel(/^role$/i).fill(app.role);
    await page.getByLabel("Grade").fill(app.grade);
    await page.getByLabel(/expected pay/i).fill(app.pay);
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText(app.role, { exact: true })).toBeVisible();
    if (app.status !== "saved") {
      await page.getByLabel(`Status for ${app.role}`).selectOption(app.status);
    }
  }

  await shoot(page, "board");

  // Self-clean so re-runs stay tidy and the local dev DB isn't polluted.
  for (const app of DEMO_APPS) {
    await page.getByRole("button", { name: `Delete ${app.role} at ${app.company}` }).click();
  }
}
