import { z } from "zod";
import { PROVIDER_IDS } from "./config";

export const coverLetterRequestSchema = z.object({
  jd: z.string().min(20, "Paste a fuller job description").max(20_000),
  cv: z.string().min(20, "Add your CV to ground the letter").max(20_000),
  provider: z.enum(PROVIDER_IDS).optional(),
});

export type CoverLetterRequest = z.infer<typeof coverLetterRequestSchema>;

// Anti-slop rules (adapted from the career-ops writing guidelines): the draft
// has to read like a specific person wrote it, not a template generator.
const SYSTEM_PROMPT = `You write cover letters that sound like a real, specific candidate — never like AI filler.

Hard rules:
- Ground every claim in the CV. Never invent experience, titles, or metrics.
- Tie the candidate's concrete experience to specific requirements named in the job description.
- Plain, direct, first person. Active voice. Short paragraphs.
- 220-320 words, 3-4 paragraphs, then a simple sign-off.

Banned (do not use): "I am excited/thrilled/delighted", "passionate", "proven track record", "results-driven", "team player", "fast-paced environment", "think outside the box", "leverage", "synergy", "dynamic", "I believe I would be a great fit", "perfect candidate". No rule-of-three lists. No "Furthermore/Moreover/In today's world" filler. Do not flatter the company with generic praise.

Output ONLY the letter (greeting, body paragraphs, sign-off). No preamble, no notes, no markdown headers.`;

export function buildCoverLetterPrompt(input: CoverLetterRequest): {
  system: string;
  prompt: string;
} {
  return {
    system: SYSTEM_PROMPT,
    prompt: `Write a tailored cover letter for this role, grounded strictly in the CV below.\n\n--- JOB DESCRIPTION ---\n${input.jd.trim()}\n\n--- CANDIDATE CV ---\n${input.cv.trim()}\n\nWrite the letter now. Output only the letter. Do not use any banned word or phrase — in particular, never write "leverage", "passionate", "excited", "proven track record", or "team player".`,
  };
}
