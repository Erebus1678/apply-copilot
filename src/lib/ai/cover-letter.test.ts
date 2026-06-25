import { coverLetterRequestSchema, buildCoverLetterPrompt } from "./cover-letter";

const jd = "Senior Frontend Engineer working with React, TypeScript and Next.js.";
const cv = "Five years building React and TypeScript products end to end.";

describe("coverLetterRequestSchema", () => {
  it("requires both a JD and a CV", () => {
    expect(coverLetterRequestSchema.safeParse({ jd, cv: "short" }).success).toBe(false);
    expect(coverLetterRequestSchema.safeParse({ jd: "short", cv }).success).toBe(false);
  });

  it("accepts a valid JD + CV", () => {
    expect(coverLetterRequestSchema.safeParse({ jd, cv }).success).toBe(true);
  });
});

describe("buildCoverLetterPrompt", () => {
  it("includes anti-slop guidance and bans clichés", () => {
    const { system } = buildCoverLetterPrompt({ jd, cv });
    expect(system).toMatch(/passionate/i);
    expect(system).toMatch(/proven track record/i);
    expect(system).toMatch(/only the letter/i);
  });

  it("grounds the prompt in both the JD and the CV", () => {
    const { prompt } = buildCoverLetterPrompt({ jd, cv });
    expect(prompt).toContain("JOB DESCRIPTION");
    expect(prompt).toContain("CANDIDATE CV");
    expect(prompt).toContain(cv);
  });
});
