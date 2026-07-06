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

export const COVER_LETTER_LENGTHS = ["standard", "short", "custom"] as const;

export type CoverLetterLength = (typeof COVER_LETTER_LENGTHS)[number];

export const COVER_LETTER_LENGTH_LABELS: Record<CoverLetterLength, string> = {
  standard: "Standard",
  short: "Short (½ page)",
  custom: "Custom",
};

const DEFAULT_CUSTOM_MAX_CHARS = 1200;

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
  length: z.enum(COVER_LETTER_LENGTHS).optional(),
  maxChars: z.number().int().min(200).max(4000).optional(),
  language: z.string().max(40).optional(),
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
- Use plain ASCII punctuation only. Never use em-dashes or en-dashes (— –) — use a comma, period, or hyphen instead. No curly/smart quotes. No ellipsis character (…) — write three periods if needed.

Banned (do not use): "I am excited/thrilled/delighted", "passionate", "proven track record", "results-driven", "team player", "fast-paced environment", "think outside the box", "leverage", "synergy", "dynamic", "I believe I would be a great fit", "perfect candidate". No rule-of-three lists. No "Furthermore/Moreover/In today's world" filler. Do not flatter the company with generic praise.

Output ONLY the letter (greeting, body paragraphs, sign-off). No preamble, no notes, no markdown headers.`;

function languageDirective(input: CoverLetterRequest): string {
  const language = input.language?.trim();
  if (language && language.toLowerCase() !== "auto") {
    return `Write the ENTIRE cover letter in ${language}.`;
  }
  return "Write the cover letter in the SAME language as the job description (detect it from the JD text).";
}

function lengthDirective(input: CoverLetterRequest): string {
  const length = input.length ?? "standard";
  if (length === "short") {
    return "Keep it to about half an A4 page: roughly 150 words in 2 tight paragraphs plus a one-line sign-off. Cut anything non-essential.";
  }
  if (length === "custom") {
    const maxChars = input.maxChars ?? DEFAULT_CUSTOM_MAX_CHARS;
    return `Keep the ENTIRE letter under ${maxChars} characters. Be concise; prioritize the strongest, most relevant points. Do not exceed this limit.`;
  }
  return "220-320 words, 3-4 paragraphs, then a simple sign-off.";
}

export function buildCoverLetterPrompt(input: CoverLetterRequest): {
  system: string;
  prompt: string;
} {
  const tone = input.tone ?? "professional";
  return {
    system: `${SYSTEM_PROMPT}\n\n${currentDateContext()}`,
    prompt: `Write a tailored cover letter for this role, grounded strictly in the CV below.\n\nTone: ${TONE_GUIDANCE[tone]}\n\nLength: ${lengthDirective(input)}\n\nLanguage: ${languageDirective(input)}\n\n--- JOB DESCRIPTION ---\n${compressPromptText(input.jd)}\n\n--- CANDIDATE CV ---\n${compressPromptText(input.cv)}\n\nWrite the letter now. Output only the letter. Do not use any banned word or phrase — in particular, never write "leverage", "passionate", "excited", "proven track record", or "team player".`,
  };
}

// Hard guarantee for custom mode: the model's length compliance is
// best-effort, this trims deterministically so the shown draft never
// exceeds the requested character budget.
export function clampToMaxChars(text: string, max: number): string {
  if (text.length <= max) return text;
  const truncated = text.slice(0, max);
  const lastBoundary = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? "),
    truncated.lastIndexOf(".\n"),
    truncated.lastIndexOf("!\n"),
    truncated.lastIndexOf("?\n"),
  );
  if (lastBoundary > -1) return truncated.slice(0, lastBoundary + 1).trim();
  return truncated.replace(/\s+\S*$/, "").trim();
}
