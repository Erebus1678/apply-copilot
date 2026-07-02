import { buildCvExtractPrompt } from "./cv-extract";

describe("buildCvExtractPrompt", () => {
  const cv =
    "Senior frontend engineer, 8 years of React and TypeScript. Built streaming dashboards.";

  it("embeds the CV and asks for a labelled, factual outline", () => {
    const { prompt } = buildCvExtractPrompt(cv);
    expect(prompt).toContain(cv);
    expect(prompt).toMatch(/Skills:/);
    expect(prompt).toMatch(/Roles:/);
    expect(prompt).toMatch(/Sections present:/);
  });

  it("forbids judging or scoring in the system prompt", () => {
    const { system } = buildCvExtractPrompt(cv);
    expect(system).toMatch(/never infer, judge, score/i);
  });
});
