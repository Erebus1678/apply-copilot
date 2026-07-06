// Deterministic post-processing for AI-generated prose (e.g. cover letters).
// Strips the artifacts a prompt can't reliably suppress — meta preambles, code
// fences, stray markdown, and whitespace noise — without rewriting sentences.
// formatting de-slop only; rewording clichés safely needs the model,
// not a regex, so that stays a prompt concern.
export function cleanAiText(text: string): string {
  let out = text.replace(/\r\n/g, "\n");

  // Unwrap a surrounding ``` code fence (optionally language-tagged).
  out = out.replace(/^\s*```[^\n]*\n([\s\S]*?)\n```\s*$/, "$1");
  // Remove a stray leading/trailing fence line if only one side was present.
  out = out.replace(/^\s*```[^\n]*\n/, "").replace(/\n```\s*$/, "");

  // Drop a leading meta preamble ("Sure! Here's your cover letter:"). Anchored
  // on a trailing colon so a real opening like "Of course I can help" survives.
  out = out.replace(
    /^\s*(?:sure|certainly|of course|absolutely|here(?:'s| is))\b[^\n]*:\s*\n+/i,
    "",
  );

  // Strip markdown bold and heading markers — this is plain prose. Single
  // asterisks are left alone: stripping them risks mangling real text ("4* / 5*").
  out = out.replace(/\*\*(.+?)\*\*/g, "$1");
  out = out.replace(/__(.+?)__/g, "$1");
  out = out.replace(/^#{1,6}\s+/gm, "");

  // Normalize typography that reads as an AI tell. Em/en dash used as a
  // sentence break (spaced) becomes a comma; used to join words (unspaced)
  // becomes a spaced hyphen. Curly quotes and ellipsis go to plain ASCII.
  out = out.replace(/ [—–] /g, ", ");
  out = out.replace(/(\w)[—–](\w)/g, "$1 - $2");
  // Catch-all: any em/en dash still standing (one-sided spacing, leading, or
  // stray) plus its surrounding spaces becomes ", " so none can survive.
  out = out.replace(/[ \t]*[—–][ \t]*/g, ", ");
  // The dash rules can create a double comma ("X, — Y" -> "X,, Y") or a stray
  // leading ", "; collapse the ",," artifact and trim a leading comma.
  out = out.replace(/,[ \t]*,/g, ", ");
  out = out.replace(/^[ \t]*,[ \t]*/, "");
  out = out.replace(/[‘’]/g, "'");
  out = out.replace(/[“”]/g, '"');
  out = out.replace(/…/g, "...");

  // Normalize whitespace.
  out = out
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return out;
}
