import { z } from "zod";
import { PROVIDER_IDS } from "./config";

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
  provider: z.enum(PROVIDER_IDS).optional(),
});

export type CvReviewRequest = z.infer<typeof cvReviewRequestSchema>;

const SYSTEM_PROMPT =
  "You are a meticulous résumé reviewer and ATS (applicant tracking system) expert. You assess how well a CV parses in automated systems and reads to a human recruiter. You are specific and honest — one real issue with a concrete fix beats generic praise.";

export function buildCvReviewPrompt(input: CvReviewRequest): { system: string; prompt: string } {
  return {
    system: SYSTEM_PROMPT,
    prompt: `Review this CV for ATS-friendliness, content quality, clarity, spelling/grammar, and formatting.\n\n--- CV ---\n${input.cv.trim()}\n\nYou MUST return an atsScore (0-100) and a summary. List concrete issues — each with the specific problem and an actionable fix — and the CV's genuine strengths. Flag any spelling or grammar mistakes as issues with category "spelling". Do NOT pad with generic advice; report only what this CV actually needs.`,
  };
}
