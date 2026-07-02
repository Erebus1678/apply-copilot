import { type Page, type Route } from "@playwright/test";

// Shared synthetic content + network mocks for the capture specs (shots + demo).
// The AI provider is stubbed at the network layer, so captures are deterministic
// and use no live model, keys, or real personal data. Selectors mirror the e2e suite.

export const SHOTS = "docs/screenshots";

// A small artificial latency so the loading state is visible in the demo GIF
// (harmless for the stills, which wait for the result before shooting).
const THINK_MS = 700;

export const CV = [
  "Alex Rivera — Senior Frontend Engineer",
  "8 years building React + TypeScript products. Shipped real-time dashboards,",
  "design systems, and streaming UIs used by millions.",
  "",
  "Experience",
  "- Staff Frontend Engineer, Meshwork (2021–present): led the migration to React 18 +",
  "  Server Components; cut LCP from 3.4s to 1.6s; built the company design system.",
  "- Frontend Engineer, Brightloom (2017–2021): owned the analytics dashboard,",
  "  introduced Playwright e2e coverage, mentored three juniors.",
  "",
  "Skills: React, TypeScript, Next.js, Node.js, testing (Jest/Playwright), CSS, accessibility.",
].join("\n");

export const JD_ANALYZE =
  "Senior Frontend Engineer. Build streaming dashboards in React and TypeScript. " +
  "Own accessibility (WCAG) and performance budgets. Partner with design on a shared " +
  "component system. GraphQL a plus. 5+ years experience required.";

const ANALYSIS = JSON.stringify({
  techStack: [
    { name: "React", importance: "required" },
    { name: "TypeScript", importance: "required" },
    { name: "Accessibility (WCAG)", importance: "required" },
    { name: "Next.js", importance: "preferred" },
    { name: "GraphQL", importance: "preferred" },
  ],
  seniority: "senior",
  archetype: "Product-focused Frontend Engineer",
  responsibilities: [
    "Build and ship streaming dashboard UIs in React + TypeScript",
    "Own accessibility and performance budgets",
    "Partner with design on a shared component system",
  ],
  fit: {
    score: 82,
    matched: ["React", "TypeScript", "Streaming dashboard UIs", "Design systems"],
    gaps: [
      { item: "Production GraphQL experience", severity: "moderate" },
      { item: "Formal WCAG 2.2 auditing", severity: "minor" },
    ],
    summary:
      "Strong match on the core React/TypeScript stack and streaming-UI experience. " +
      "Closing the GraphQL and formal-accessibility gaps would make this a top-tier fit.",
  },
});

const CV_REVIEW = JSON.stringify({
  atsScore: 78,
  summary:
    "A solid, ATS-parseable CV with strong project detail. A couple of keyword and " +
    "quantification gaps keep it out of the top band.",
  issues: [
    {
      category: "ats",
      severity: "moderate",
      problem: "Skills are listed in prose, not a dedicated 'Skills' section",
      fix: "Add a compact Skills line (React, TypeScript, Node.js, Playwright) so keyword matching is reliable.",
    },
    {
      category: "content",
      severity: "moderate",
      problem: "Some achievements lack measurable impact",
      fix: "Quantify results, e.g. 'cut LCP from 3.4s to 1.6s, lifting conversion 12%'.",
    },
    {
      category: "clarity",
      severity: "minor",
      problem: "The summary restates the job title without a positioning angle",
      fix: "Lead with a one-line value proposition tied to the roles you target.",
    },
  ],
  strengths: [
    "Clear reverse-chronological structure",
    "Strong, relevant project work",
    "Consistent, recent tech stack",
  ],
});

const COVER_LETTER = [
  "Dear Hiring Team,",
  "",
  "Your Senior Frontend Engineer role reads like a description of the last three years of my work. " +
    "At Meshwork I led our move to React 18 and Server Components, cutting LCP from 3.4s to 1.6s while " +
    "building the design system three product teams now ship on.",
  "",
  "Streaming dashboards are exactly the problem I enjoy: keeping a real-time UI fast, accessible, and " +
    "calm under load. I hold myself to real performance and WCAG budgets rather than treating them as " +
    "afterthoughts, and I'd bring that same discipline to your component system.",
  "",
  "I'd love to talk about how I can help your team ship faster without trading away quality.",
  "",
  "Best regards,",
  "Alex Rivera",
].join("\n");

/** Fulfil a route with a delayed text body, mimicking a model thinking then answering. */
function streamText(body: string) {
  return async (route: Route) => {
    await new Promise((r) => setTimeout(r, THINK_MS));
    await route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body });
  };
}

export async function seedCv(page: Page) {
  // Wait for the default profile to resolve first: the CV is stored per active
  // profile, so seeding before the async auto-pick lands writes it under the
  // transient "default" id and the box clears when "Personal" switches in.
  await page.getByRole("button", { name: "Personal" }).waitFor({ timeout: 30_000 });
  await page.getByLabel(/your cv/i).fill(CV);
}

export async function registerMocks(page: Page) {
  await page.route("**/api/analyze", streamText(ANALYSIS));
  await page.route("**/api/cv-review", streamText(CV_REVIEW));
  await page.route("**/api/cover-letter", streamText(COVER_LETTER));
}
