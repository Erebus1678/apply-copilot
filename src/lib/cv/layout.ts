import { z } from "zod";

// A small, deterministic description of a CV's structure, computed at extraction
// time. It travels with the extracted text to the AI so formatting feedback is
// grounded in facts we actually detected — never inferred from flattened text.
// `null` on a field means "unknown / not detectable", NOT "absent".
export const layoutReportSchema = z.object({
  source: z.enum(["pdf", "docx", "text"]),
  pageCount: z.number().int().nullable(),
  columns: z.union([z.literal(1), z.literal(2), z.literal("multi")]).nullable(),
  hasTables: z.boolean().nullable(),
  hasTextBoxes: z.boolean().nullable(),
  contactInHeaderFooter: z.boolean().nullable(),
  imageCount: z.number().int().nullable(),
  sections: z.array(z.string()),
  confidence: z.enum(["high", "medium"]),
});

export type LayoutReport = z.infer<typeof layoutReportSchema>;

const SECTION_GROUPS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["Summary", ["summary", "objective", "profile", "about me", "about"]],
  [
    "Experience",
    ["work experience", "professional experience", "experience", "employment", "work history"],
  ],
  ["Education", ["education", "academic background", "academic"]],
  ["Skills", ["technical skills", "core competencies", "skills", "technologies", "expertise"]],
  ["Projects", ["personal projects", "projects"]],
  ["Certifications", ["certifications", "certificates", "licenses"]],
  ["Awards", ["achievements", "awards", "honors"]],
  ["Languages", ["languages"]],
  ["Publications", ["publications"]],
  ["Volunteer", ["volunteering", "volunteer"]],
  ["Interests", ["interests", "hobbies"]],
  ["References", ["references"]],
];

/**
 * Find the standard CV section headings present in the text. A heading is a short
 * standalone line matching a known keyword — this survives plain-text extraction,
 * so it works for every source. A missing expected section can signal it lived in
 * an image or text box the parser dropped.
 */
export function detectSections(text: string): string[] {
  const found = new Set<string>();
  for (const rawLine of text.split("\n")) {
    const line = rawLine
      .trim()
      .toLowerCase()
      .replace(/[\s:•·\-–—|]+$/u, "");
    if (!line || line.length > 40) continue;
    for (const [label, keywords] of SECTION_GROUPS) {
      if (keywords.some((k) => line === k || line.startsWith(`${k} `))) {
        found.add(label);
        break;
      }
    }
  }
  return SECTION_GROUPS.map(([label]) => label).filter((l) => found.has(l));
}

/** Plain text (pasted / .txt / .md) has no recoverable visual layout. */
export function textLayout(text: string): LayoutReport {
  return {
    source: "text",
    pageCount: null,
    columns: null,
    hasTables: null,
    hasTextBoxes: null,
    contactInHeaderFooter: null,
    imageCount: null,
    sections: detectSections(text),
    confidence: "high",
  };
}

/** Fallback when detection fails — text still flows; formatting just won't be judged. */
export function emptyLayout(source: LayoutReport["source"]): LayoutReport {
  return {
    source,
    pageCount: null,
    columns: null,
    hasTables: null,
    hasTextBoxes: null,
    contactInHeaderFooter: null,
    imageCount: null,
    sections: [],
    confidence: source === "docx" ? "high" : "medium",
  };
}

/** Render the report as a compact prompt block — only known (non-null) fields. */
export function formatLayoutForPrompt(r: LayoutReport): string {
  const lines: string[] = [];
  if (r.pageCount != null) lines.push(`pages: ${r.pageCount}`);
  if (r.columns != null) lines.push(`columns: ${r.columns}`);
  if (r.hasTables != null) lines.push(`tables: ${r.hasTables ? "yes" : "no"}`);
  if (r.hasTextBoxes != null) lines.push(`text boxes: ${r.hasTextBoxes ? "yes" : "no"}`);
  if (r.contactInHeaderFooter != null)
    lines.push(`contact in header/footer: ${r.contactInHeaderFooter ? "yes" : "no"}`);
  if (r.imageCount != null) lines.push(`images: ${r.imageCount}`);
  if (r.sections.length) lines.push(`detected sections: ${r.sections.join(", ")}`);
  const body = lines.length ? lines.join("\n") : "no structural signals detected";
  return `--- LAYOUT REPORT (${r.source}, ${r.confidence} confidence) ---\n${body}`;
}
