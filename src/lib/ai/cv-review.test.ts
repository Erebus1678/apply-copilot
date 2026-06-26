import { buildCvReviewPrompt, cvReviewRequestSchema, cvReviewSchema } from "./cv-review";

const cv = "Senior frontend engineer with 8 years building React and TypeScript products at scale.";

describe("cvReviewRequestSchema", () => {
  it("rejects a CV shorter than 50 chars", () => {
    expect(cvReviewRequestSchema.safeParse({ cv: "too short" }).success).toBe(false);
  });

  it("accepts a long enough CV", () => {
    expect(cvReviewRequestSchema.safeParse({ cv }).success).toBe(true);
  });
});

describe("buildCvReviewPrompt", () => {
  it("embeds the CV and demands a score, fixes, and spelling flags", () => {
    const { system, prompt } = buildCvReviewPrompt({ cv });
    expect(system).toMatch(/ATS/);
    expect(prompt).toContain(cv);
    expect(prompt).toContain("atsScore");
    expect(prompt).toMatch(/spelling/i);
  });
});

describe("cvReviewSchema", () => {
  it("parses a complete review object", () => {
    const result = cvReviewSchema.safeParse({
      atsScore: 64,
      summary: "Solid content, but the layout hurts ATS parsing.",
      issues: [
        { category: "ats", severity: "major", problem: "Two-column layout", fix: "Use one column" },
        { category: "spelling", severity: "minor", problem: "'recieve'", fix: "Spell 'receive'" },
      ],
      strengths: ["Quantified impact", "Relevant stack"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an out-of-range score", () => {
    expect(
      cvReviewSchema.safeParse({ atsScore: 140, summary: "x", issues: [], strengths: [] }).success,
    ).toBe(false);
  });
});
