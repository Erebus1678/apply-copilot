import { z } from "zod";
import { compressPromptText } from "./compress";
import { currentDateContext } from "./context";
import { providerOverrideFields } from "./override";

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
  demo: z.boolean().optional(),
  ...providerOverrideFields,
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

const SYSTEM_PROMPT =
  "You are a precise technical recruiter. Extract only what the job description states; do not invent requirements. When a CV is provided, assess fit honestly — a low score with real gaps is more useful than flattery. When no CV is provided, set `fit` to null. Judge fit only on skills, experience, and projects: never let the candidate's name, gender, age, nationality, school/university name, GPA/grades, or city/location affect the score or any feedback. Use plain ASCII punctuation only: no em-dashes or en-dashes (— –), no curly quotes, no ellipsis character (write three periods).";

// Banded anchors so the fit score is consistent and explainable, not an arbitrary number.
const FIT_RUBRIC = `Score \`fit.score\` on this scale:
- 85-100: strong — meets nearly all required skills with relevant depth; no major gaps.
- 70-84: good — meets most requirements; only minor gaps.
- 50-69: partial — meets some requirements; real, moderate gaps remain.
- 30-49: weak — misses several required skills.
- 0-29: poor — largely unrelated to the role.`;

export function buildAnalysisPrompt(input: AnalyzeRequest): { system: string; prompt: string } {
  const cv = input.cv?.trim() ? compressPromptText(input.cv) : "";
  const cvBlock = cv
    ? `\n\n--- CANDIDATE CV ---\n${cv}\n\nA CV is provided above. You MUST populate the \`fit\` object — a score (0-100), matched requirements, gaps, and a summary. Do NOT set fit to null.\n\n${FIT_RUBRIC}\n\nGrounding: each \`matched\` item must be backed by something actually in the CV, and each \`gap\` must name a specific requirement from the job description that the CV does not clearly satisfy. Never invent requirements or experience.`
    : "\n\n(No CV provided — set fit to null.)";
  return {
    system: `${SYSTEM_PROMPT}\n\n${currentDateContext()}`,
    prompt: `Analyze this job description.\n\n--- JOB DESCRIPTION ---\n${compressPromptText(input.jd)}${cvBlock}`,
  };
}
