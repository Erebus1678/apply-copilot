import { test, expect } from "@playwright/test";

// End-to-end analyze journey with the AI provider mocked at the network layer,
// so it's deterministic and needs no live model. Covers the multi-step flow
// (enter CV + JD → stream a fit result) and error recovery (a failed request
// shows an error, then a retry succeeds) — the gaps the audit flagged over the
// prior smoke-only e2e.

const JD =
  "Senior Frontend Engineer. Build streaming dashboards in React and TypeScript. " +
  "5+ years experience required. Strong CSS and accessibility skills.";

const ANALYSIS = JSON.stringify({
  techStack: [
    { name: "React", importance: "required" },
    { name: "TypeScript", importance: "required" },
  ],
  seniority: "senior",
  archetype: "Frontend engineer",
  responsibilities: ["Build and ship dashboard UIs"],
  fit: {
    score: 82,
    summary: "Strong match on the core stack.",
    matched: ["React", "TypeScript"],
    gaps: [],
  },
});

test("CV + JD analyze streams a fit score", async ({ page }) => {
  await page.route("**/api/analyze", (route) =>
    route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: ANALYSIS }),
  );

  await page.goto("/analyze");
  await page.getByLabel(/your cv/i).fill("Senior frontend engineer, 8 years React + TypeScript.");
  await page.getByPlaceholder(/paste the full job description/i).fill(JD);
  await page.getByRole("button", { name: /^analyze$/i }).click();

  await expect(page.getByRole("img", { name: /cv fit score: 82 out of 100/i })).toBeVisible();
  // Unique to the mocked response — avoids colliding with JD/CV text on the page.
  await expect(page.getByText("Strong match on the core stack.")).toBeVisible();
});

test("a failed analyze shows an error, then a retry succeeds", async ({ page }) => {
  let attempt = 0;
  await page.route("**/api/analyze", (route) => {
    attempt += 1;
    if (attempt === 1) {
      return route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ error: "The AI request failed. Try another provider." }),
      });
    }
    return route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: ANALYSIS });
  });

  await page.goto("/analyze");
  await page.getByLabel(/your cv/i).fill("Senior frontend engineer, React + TypeScript.");
  await page.getByPlaceholder(/paste the full job description/i).fill(JD);

  await page.getByRole("button", { name: /^analyze$/i }).click();
  // Scope to our error text — a bare getByRole("alert") also matches Next's
  // route-announcer live region.
  await expect(page.getByText(/the ai request failed/i)).toBeVisible();

  // Recover: a second attempt (mock now succeeds) renders the result.
  await page.getByRole("button", { name: /^analyze$/i }).click();
  await expect(page.getByRole("img", { name: /cv fit score: 82 out of 100/i })).toBeVisible();
});
