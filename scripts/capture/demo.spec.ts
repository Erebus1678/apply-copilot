import { test, expect } from "@playwright/test";
import { JD_ANALYZE, seedCv, registerMocks } from "./fixtures";

// Records the analyze flow to a .webm (converted to a GIF by make-gif.mjs, which
// keeps only the last few seconds so the cold-start/compile intro is dropped).
// video is enabled top-level here — `test.use({ video })` inside a describe group
// is rejected by Playwright ("forces a new worker").
// Viewport and video size MUST match, else the page (which the "Desktop Chrome"
// project pins to 1280×720) sits in a larger video frame and leaves grey margins.
// Set both explicitly here so the recording is edge-to-edge.
test.use({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  video: { mode: "on", size: { width: 1280, height: 800 } },
});

test("analyze flow demo", async ({ page }) => {
  await registerMocks(page);
  await page.goto("/analyze");
  await expect(page.getByRole("heading", { name: /analyze a job description/i })).toBeVisible();
  await seedCv(page);

  // Type the JD (real interaction), then reveal the streamed fit result.
  const jd = page.getByPlaceholder(/paste the full job description/i);
  await jd.click();
  await jd.pressSequentially(JD_ANALYZE, { delay: 14 });
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^analyze$/i }).click();
  await expect(page.getByRole("img", { name: /cv fit score: 82 out of 100/i })).toBeVisible();

  // End on the clean top view (heading · JD · fit) and hold — this is the frame
  // the looping GIF lingers on, so it must not be the scrolled-down footer.
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.waitForTimeout(2500);
});
