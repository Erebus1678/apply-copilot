import { coverLetterRequestSchema, buildCoverLetterPrompt, clampToMaxChars } from "./cover-letter";

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

  it("uses the standard length directive by default", () => {
    const { prompt } = buildCoverLetterPrompt({ jd, cv });
    expect(prompt).toContain("220-320 words");
  });

  it("uses the short length directive", () => {
    const { prompt } = buildCoverLetterPrompt({ jd, cv, length: "short" });
    expect(prompt).toContain("half an A4 page");
    expect(prompt).toContain("150 words");
  });

  it("uses the custom length directive with the given maxChars", () => {
    const { prompt } = buildCoverLetterPrompt({ jd, cv, length: "custom", maxChars: 500 });
    expect(prompt).toContain("under 500 characters");
  });

  it("defaults custom maxChars to 1200 when missing", () => {
    const { prompt } = buildCoverLetterPrompt({ jd, cv, length: "custom" });
    expect(prompt).toContain("under 1200 characters");
  });

  it("uses the match-JD language directive by default", () => {
    const { prompt } = buildCoverLetterPrompt({ jd, cv });
    expect(prompt).toContain("SAME language as the job description");
  });

  it("uses the match-JD language directive when language is 'auto'", () => {
    const { prompt } = buildCoverLetterPrompt({ jd, cv, language: "auto" });
    expect(prompt).toContain("SAME language as the job description");
  });

  it("uses the explicit-language directive when language is set", () => {
    const { prompt } = buildCoverLetterPrompt({ jd, cv, language: "Ukrainian" });
    expect(prompt).toContain("Write the ENTIRE cover letter in Ukrainian.");
  });
});

describe("clampToMaxChars", () => {
  it("returns text unchanged when within the limit", () => {
    expect(clampToMaxChars("Short text.", 100)).toBe("Short text.");
  });

  it("trims at the last sentence boundary at or before max", () => {
    const text = "First sentence. Second sentence. Third sentence that goes long.";
    const result = clampToMaxChars(text, 40);
    expect(result).toBe("First sentence. Second sentence.");
    expect(result.length).toBeLessThanOrEqual(40);
  });

  it("hard-cuts and trims a trailing partial word when no boundary exists", () => {
    const text = "Supercalifragilisticexpialidocious word soup with no punctuation anywhere";
    const result = clampToMaxChars(text, 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toBe("Supercalifragilistic");
  });
});
