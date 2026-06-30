import { z } from "zod";
import { formatLayoutForPrompt, layoutReportSchema } from "@/lib/cv/layout";
import { compressPromptText } from "./compress";
import { currentDateContext } from "./context";
import { providerOverrideFields } from "./override";

export const CV_ISSUE_CATEGORIES = ["ats", "content", "clarity", "spelling", "formatting"] as const;

/** Structured output of a CV quality / ATS review. */
export const cvReviewSchema = z.object({
  atsScore: z
    .number()
    .min(0)
    .max(100)
    .describe("0-100: how cleanly an ATS can parse and rank this CV"),
  summary: z.string().describe("A 2-3 sentence, honest overall assessment"),
  issues: z
    .array(
      z.object({
        category: z.enum(CV_ISSUE_CATEGORIES),
        severity: z.enum(["minor", "moderate", "major"]),
        problem: z.string().describe("What is wrong, specifically"),
        fix: z.string().describe("A concrete, actionable fix"),
      }),
    )
    .describe("Concrete problems found, most important first"),
  strengths: z.array(z.string()).describe("What the CV already does well"),
});

export type CvReview = z.infer<typeof cvReviewSchema>;

/** Input contract for the CV review endpoint. */
export const cvReviewRequestSchema = z.object({
  cv: z.string().min(50, "Paste a fuller CV").max(20_000),
  layout: layoutReportSchema.nullish(),
  ...providerOverrideFields,
});

export type CvReviewRequest = z.infer<typeof cvReviewRequestSchema>;

const SYSTEM_PROMPT =
  "You are a meticulous résumé reviewer and ATS (applicant tracking system) expert. You assess how well a CV parses in automated systems and reads to a human recruiter. You are specific and honest — one real issue with a concrete fix beats generic praise.";

const NO_LAYOUT_GUIDANCE =
  "No layout information is available (the text was pasted, not parsed from a file). Do NOT give any formatting or visual-layout advice — judge only wording, content, keyword/skill coverage, dates, and spelling/grammar. The text is extracted plain text, so never treat its whitespace or line breaks as the CV's real formatting.";

function layoutGuidance(input: CvReviewRequest): string {
  if (!input.layout) return NO_LAYOUT_GUIDANCE;
  return `${formatLayoutForPrompt(input.layout)}\n\nThis report is the ONLY basis for formatting/layout feedback. Raise a formatting issue ONLY if it follows directly from a value above (e.g. columns:2 → an ATS may scramble reading order; "contact in header/footer: yes" → an ATS may miss it; an expected section absent from "detected sections" may have been an image). Any field not listed is UNKNOWN — do not comment on it. Never infer layout from the whitespace or line breaks of the extracted text.`;
}

const ISSUE_RULES = `Rules for issues (follow exactly):
- Every "fix" MUST be a concrete change whose wording differs from the original. NEVER restate the same text as the fix (e.g. problem "typo in 'Datadog'" / fix "should be 'Datadog'" with no change). If you cannot propose a real change, do NOT raise the issue.
- Only flag a spelling/grammar issue when the text is actually wrong. Do not "note" correct words as potential mistakes.
- You receive EXTRACTED PLAIN TEXT, not the rendered document. You CANNOT see fonts, bold, colours, blank-line spacing, bullet symbols, or whether links are clickable — so never raise issues about any of those, and never infer them from the text's whitespace or line breaks. Formatting/layout feedback may come ONLY from the layout report below.`;

export function buildCvReviewPrompt(input: CvReviewRequest): { system: string; prompt: string } {
  return {
    system: `${SYSTEM_PROMPT}\n\n${currentDateContext()}`,
    prompt: `Review this CV for ATS-friendliness, content quality, clarity, and spelling/grammar.\n\n--- CV (extracted text) ---\n${compressPromptText(input.cv)}\n\n${layoutGuidance(input)}\n\n${ISSUE_RULES}\n\nYou MUST return an atsScore (0-100) and a summary. List concrete issues — each with the specific problem and an actionable fix — and the CV's genuine strengths. Flag any spelling or grammar mistakes as issues with category "spelling". Do NOT pad with generic advice; report only what this CV actually needs.`,
  };
}
