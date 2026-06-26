import { cleanAiText } from "./clean-text";

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
});
