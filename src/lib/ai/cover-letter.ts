import { z } from "zod";
import { compressPromptText } from "./compress";
import { currentDateContext } from "./context";
import { providerOverrideFields } from "./override";

export const COVER_LETTER_TONES = [
  "professional",
  "warm",
  "direct",
  "confident",
  "understated",
] as const;

export type CoverLetterTone = (typeof COVER_LETTER_TONES)[number];

export const COVER_LETTER_TONE_LABELS: Record<CoverLetterTone, string> = {
  professional: "Professional",
  warm: "Warm",
  direct: "Direct",
  confident: "Confident",
  understated: "Understated",
};

// How each tone steers the draft. Kept tight so the model shifts register
// without inventing content or breaking the anti-slop rules.
const TONE_GUIDANCE: Record<CoverLetterTone, string> = {
  professional: "Neutral, polished, businesslike. Respectful and measured.",
  warm: "Friendly and personable while staying professional — an approachable human voice.",
  direct: "Concise and matter-of-fact. Short sentences, no hedging, no filler.",
  confident:
    "Assured about the fit, grounded strictly in CV evidence. Never boastful, pushy, or salesy.",
  understated:
    "Modest and restrained. Let the experience speak; avoid strong self-promotion or eager language.",
};

export const coverLetterRequestSchema = z.object({
  jd: z.string().min(20, "Paste a fuller job description").max(20_000),
  cv: z.string().min(20, "Add your CV to ground the letter").max(20_000),
  tone: z.enum(COVER_LETTER_TONES).optional(),
  ...providerOverrideFields,
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
  const tone = input.tone ?? "professional";
  return {
    system: `${SYSTEM_PROMPT}\n\n${currentDateContext()}`,
    prompt: `Write a tailored cover letter for this role, grounded strictly in the CV below.\n\nTone: ${TONE_GUIDANCE[tone]}\n\n--- JOB DESCRIPTION ---\n${compressPromptText(input.jd)}\n\n--- CANDIDATE CV ---\n${compressPromptText(input.cv)}\n\nWrite the letter now. Output only the letter. Do not use any banned word or phrase — in particular, never write "leverage", "passionate", "excited", "proven track record", or "team player".`,
  };
}
