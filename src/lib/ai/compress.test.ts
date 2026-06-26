import { compressPromptText, compressionStats, estimateTokens } from "./compress";

describe("compressPromptText", () => {
  it("collapses whitespace and blank-line runs", () => {
    expect(compressPromptText("a   b\n\n\n\nc  \n")).toBe("a b\n\nc");
  });

  it("removes separator/rule lines", () => {
    expect(compressPromptText("Title\n======\nBody")).toBe("Title\nBody");
  });

  it("drops consecutive duplicate lines", () => {
    expect(compressPromptText("- item\n- item\n- other")).toBe("- item\n- other");
  });

  it("leaves already-tight prose unchanged", () => {
    const tight = "Senior engineer.\n\nReact and TypeScript.";
    expect(compressPromptText(tight)).toBe(tight);
  });
});

describe("estimateTokens", () => {
  it("approximates ~4 chars per token", () => {
    expect(estimateTokens("12345678")).toBe(2);
    expect(estimateTokens("")).toBe(0);
  });
});

describe("compressionStats", () => {
  it("reports a positive saving for padded text", () => {
    const padded = "word     ".repeat(40) + "\n\n\n\n" + "line\nline\nline\n";
    const { savedPercent, compressed } = compressionStats(padded);
    expect(savedPercent).toBeGreaterThan(0);
    expect(compressed.length).toBeLessThan(padded.length);
  });

  it("reports zero saving for empty input", () => {
    expect(compressionStats("").savedPercent).toBe(0);
  });
});
