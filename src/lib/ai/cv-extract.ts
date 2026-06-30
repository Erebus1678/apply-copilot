import { compressPromptText } from "./compress";
import { currentDateContext } from "./context";

// Stage one of "thorough" CV review: a factual, plain-text outline of the CV.
// Plain text (not JSON) on purpose — local models are flaky with structured
// output, but every model can write a short outline. The evaluator then reasons
// over this clean structure instead of re-parsing the raw text, which cuts
// hallucinations. It only restates what's there — no scoring, no judgement.

const EXTRACT_SYSTEM =
  "You extract a concise, factual outline of a CV. You restate only what is present — never infer, judge, score, or add anything. Output plain text only, no preamble or markdown headers.";

export function buildCvExtractPrompt(cv: string): { system: string; prompt: string } {
  return {
    system: `${EXTRACT_SYSTEM}\n\n${currentDateContext()}`,
    prompt: `From the CV below, produce a compact outline using these labelled lines (skip a line if the CV lacks it):
- Years of experience: <total, estimated from role dates>
- Roles: <title — duration; title — duration; …>
- Skills: <comma-separated, exactly as written>
- Projects: <name (link: yes/no); …>
- Sections present: <e.g. summary, experience, skills, education, projects>

Restate only what the CV states. Do not add, infer, or evaluate anything.

--- CV (extracted text) ---
${compressPromptText(cv)}`,
  };
}
