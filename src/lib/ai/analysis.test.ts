import { analyzeRequestSchema, analysisSchema, buildAnalysisPrompt } from "./analysis";

describe("analyzeRequestSchema", () => {
  it("rejects a job description shorter than 20 chars", () => {
    expect(analyzeRequestSchema.safeParse({ jd: "too short" }).success).toBe(false);
  });

  it("accepts a valid JD without a CV", () => {
    const result = analyzeRequestSchema.safeParse({
      jd: "We are hiring a senior React engineer to build streaming UIs.",
    });
    expect(result.success).toBe(true);
  });
});

describe("buildAnalysisPrompt", () => {
  const jd = "Senior frontend role working with React, TypeScript and AWS.";

  it("instructs the model to null fit when no CV is given", () => {
    const { prompt, system } = buildAnalysisPrompt({ jd });
    expect(system).toMatch(/recruiter/i);
    expect(prompt).toContain("No CV provided");
    expect(prompt).not.toContain("CANDIDATE CV");
  });

  it("includes the CV block when a CV is provided", () => {
    const { prompt } = buildAnalysisPrompt({ jd, cv: "10 years of React experience." });
    expect(prompt).toContain("CANDIDATE CV");
    expect(prompt).toContain("10 years of React experience.");
  });

  it("includes the fit rubric and fairness guardrails with a CV", () => {
    const { prompt, system } = buildAnalysisPrompt({ jd, cv: "10 years of React." });
    expect(prompt).toContain("85-100"); // banded fit anchors
    expect(system).toMatch(/never let the candidate's name/i);
  });
});

describe("analysisSchema", () => {
  it("parses a complete analysis object", () => {
    const result = analysisSchema.safeParse({
      techStack: [{ name: "React", importance: "required" }],
      seniority: "senior",
      archetype: "Product-focused frontend engineer",
      responsibilities: ["Build streaming UIs"],
      fit: {
        score: 82,
        matched: ["React", "TypeScript"],
        gaps: [{ item: "AWS deployment", severity: "moderate" }],
        summary: "Strong frontend match with a cloud gap.",
      },
    });
    expect(result.success).toBe(true);
  });

  it("allows a null fit when no CV was analyzed", () => {
    const result = analysisSchema.safeParse({
      techStack: [],
      seniority: "mid",
      archetype: "Generalist",
      responsibilities: [],
      fit: null,
    });
    expect(result.success).toBe(true);
  });
});
