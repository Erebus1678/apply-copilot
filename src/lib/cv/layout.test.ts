import { detectSections, emptyLayout, formatLayoutForPrompt, textLayout } from "./layout";

describe("detectSections", () => {
  it("finds standard headings on their own lines, case-insensitively", () => {
    const cv = "John Doe\n\nWORK EXPERIENCE\nAcme – Engineer\n\nEducation:\nBSc\n\nSkills\nTS, Go";
    expect(detectSections(cv)).toEqual(["Experience", "Education", "Skills"]);
  });

  it("does not match a keyword buried inside a sentence", () => {
    expect(detectSections("I have broad experience building skills for teams.")).toEqual([]);
  });

  it("returns labels in canonical order regardless of document order", () => {
    expect(detectSections("Skills\n\nExperience\n\nSummary")).toEqual([
      "Summary",
      "Experience",
      "Skills",
    ]);
  });
});

describe("formatLayoutForPrompt", () => {
  it("lists only known (non-null) fields", () => {
    const block = formatLayoutForPrompt({
      source: "docx",
      pageCount: null,
      columns: 2,
      hasTables: true,
      hasTextBoxes: false,
      contactInHeaderFooter: true,
      imageCount: 1,
      sections: ["Experience"],
      confidence: "high",
    });
    expect(block).toContain("columns: 2");
    expect(block).toContain("tables: yes");
    expect(block).toContain("contact in header/footer: yes");
    expect(block).toContain("images: 1");
    expect(block).toContain("detected sections: Experience");
    expect(block).not.toContain("pages:"); // null is omitted, not shown as a guess
  });

  it("falls back to a clear message when nothing was detected", () => {
    expect(formatLayoutForPrompt(emptyLayout("pdf"))).toContain("no structural signals detected");
  });
});

describe("textLayout", () => {
  it("marks all visual fields unknown but still detects sections", () => {
    const layout = textLayout("Summary\nLooking for work\n\nSkills\nTS");
    expect(layout.source).toBe("text");
    expect(layout.columns).toBeNull();
    expect(layout.contactInHeaderFooter).toBeNull();
    expect(layout.sections).toEqual(["Summary", "Skills"]);
  });
});
