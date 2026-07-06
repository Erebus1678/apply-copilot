import { cleanAiText, normalizeTypography } from "./clean-text";

describe("cleanAiText", () => {
  it("drops a meta preamble line", () => {
    expect(cleanAiText("Sure! Here's your cover letter:\n\nDear team,")).toBe("Dear team,");
    expect(cleanAiText("Here is the letter:\n\nDear team,")).toBe("Dear team,");
  });

  it("unwraps a surrounding code fence", () => {
    expect(cleanAiText("```\nDear team,\n\nThanks.\n```")).toBe("Dear team,\n\nThanks.");
    expect(cleanAiText("```text\nDear team,\n```")).toBe("Dear team,");
  });

  it("strips markdown bold and headings", () => {
    expect(cleanAiText("**Dear** team, I am __very__ keen.")).toBe("Dear team, I am very keen.");
    expect(cleanAiText("# Cover letter\n\nDear team,")).toBe("Cover letter\n\nDear team,");
  });

  it("leaves lone asterisks and non-preamble openings alone", () => {
    expect(cleanAiText("We rate 4* and 5* hotels.")).toBe("We rate 4* and 5* hotels.");
    expect(cleanAiText("Of course I can help with that.")).toBe("Of course I can help with that.");
  });

  it("normalizes whitespace", () => {
    expect(cleanAiText("Dear   team,\n\n\n\nThanks.   \n")).toBe("Dear team,\n\nThanks.");
  });

  it("leaves clean prose unchanged", () => {
    const clean = "Dear hiring team,\n\nI build streaming UIs.\n\nBest,\nDmytro";
    expect(cleanAiText(clean)).toBe(clean);
  });

  it("normalizes em-dashes and en-dashes to commas or hyphens", () => {
    expect(cleanAiText("I led the project — end to end.")).toBe("I led the project, end to end.");
    expect(cleanAiText("I led the project – end to end.")).toBe("I led the project, end to end.");
    expect(cleanAiText("a well—known result")).toBe("a well - known result");
  });

  it("normalizes curly quotes and ellipsis to ASCII", () => {
    expect(cleanAiText("She said “hello” and it's a ‘test’.")).toBe(
      "She said \"hello\" and it's a 'test'.",
    );
    expect(cleanAiText("Wait for it…")).toBe("Wait for it...");
  });

  it("catches em-dashes with one-sided spacing", () => {
    const a = cleanAiText("I led it —end to end.");
    const b = cleanAiText("I led it— end to end.");
    expect(a).not.toMatch(/[—–]/);
    expect(b).not.toMatch(/[—–]/);
    expect(a).toBe("I led it, end to end.");
    expect(b).toBe("I led it, end to end.");
  });

  it("does not leave a double comma when a comma precedes the dash", () => {
    expect(cleanAiText("X, — Y")).toBe("X, Y");
  });

  it("leaves a real hyphen unchanged", () => {
    const clean = "This is a well-known, state-of-the-art approach.";
    expect(cleanAiText(clean)).toBe(clean);
  });
});

describe("normalizeTypography", () => {
  it("strips em-dashes and en-dashes", () => {
    expect(normalizeTypography("I led the project — end to end.")).toBe(
      "I led the project, end to end.",
    );
    expect(normalizeTypography("a well—known result")).not.toMatch(/[—–]/);
  });

  it("normalizes curly quotes and ellipsis to ASCII", () => {
    expect(normalizeTypography("She said “hi”, it's a ‘test’.")).toBe(
      "She said \"hi\", it's a 'test'.",
    );
    expect(normalizeTypography("Wait for it…")).toBe("Wait for it...");
  });
});
