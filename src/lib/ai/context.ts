/**
 * A one-line "now" anchor for prompts. Without it, a model defaults to its
 * training-cutoff year (often guessing 2025) and then misjudges recency,
 * durations, or whether a role/skill is current. Computed per request.
 */
export function currentDateContext(): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
  return `Today's date is ${today}. Treat this as "now" when reasoning about dates, recency, durations, or whether something is current — never assume a different year.`;
}
