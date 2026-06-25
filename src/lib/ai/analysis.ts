import { z } from "zod";

export const SENIORITY_LEVELS = ["junior", "mid", "senior", "staff", "lead", "principal"] as const;

/** Structured output of a job-description analysis (+ optional CV fit). */
export const analysisSchema = z.object({
  techStack: z
    .array(
      z.object({
        name: z.string().describe("A technology, language, framework, or tool"),
        importance: z
          .enum(["required", "preferred"])
          .describe("required = must-have, preferred = nice-to-have"),
      }),
    )
    .describe("Technologies the job description asks for"),
  seniority: z.enum(SENIORITY_LEVELS).describe("Seniority level the role targets"),
  archetype: z
    .string()
    .describe("A short role archetype, e.g. 'Product-focused frontend engineer'"),
  responsibilities: z.array(z.string()).describe("The key responsibilities, each a concise phrase"),
  fit: z
    .object({
      score: z.number().min(0).max(100).describe("0-100 fit of the CV against this role"),
      matched: z.array(z.string()).describe("Requirements the CV clearly satisfies"),
      gaps: z
        .array(
          z.object({
            item: z.string().describe("A requirement the CV does not clearly satisfy"),
            severity: z.enum(["minor", "moderate", "major"]),
          }),
        )
        .describe("Gaps between the CV and the role"),
      summary: z.string().describe("A 2-3 sentence, honest fit summary"),
    })
    .nullable()
    .describe("CV fit assessment; null when no CV was provided"),
});

export type Analysis = z.infer<typeof analysisSchema>;

/** Input contract for the analyze endpoint. */
export const analyzeRequestSchema = z.object({
  jd: z.string().min(20, "Paste a fuller job description").max(20_000),
  cv: z.string().max(20_000).optional(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

const SYSTEM_PROMPT =
  "You are a precise technical recruiter. Extract only what the job description states; do not invent requirements. When a CV is provided, assess fit honestly — a low score with real gaps is more useful than flattery. When no CV is provided, set `fit` to null.";

export function buildAnalysisPrompt(input: AnalyzeRequest): { system: string; prompt: string } {
  const cvBlock = input.cv?.trim()
    ? `\n\n--- CANDIDATE CV ---\n${input.cv.trim()}\n\nA CV is provided above. You MUST populate the \`fit\` object — a score (0-100), matched requirements, gaps, and a summary. Do NOT set fit to null.`
    : "\n\n(No CV provided — set fit to null.)";
  return {
    system: SYSTEM_PROMPT,
    prompt: `Analyze this job description.\n\n--- JOB DESCRIPTION ---\n${input.jd.trim()}${cvBlock}`,
  };
}
