type Tone = "success" | "warning" | "destructive";

function scoreTone(score: number): Tone {
  if (score >= 70) return "success";
  if (score >= 45) return "warning";
  return "destructive";
}

const TONE_STROKE: Record<Tone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  destructive: "var(--destructive)",
};

type Props = {
  score: number;
  /** Used to build the accessible label, e.g. "CV fit score: 72 out of 100". */
  label: string;
};

/** A circular 0-100 score gauge, tone-colored by band. */
export function ScoreRing({ score, label }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const tone = scoreTone(clamped);
  return (
    <div
      className="relative size-24 shrink-0"
      role="img"
      aria-label={`${label}: ${clamped} out of 100`}
    >
      <svg viewBox="0 0 80 80" className="size-24 -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--muted)" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={TONE_STROKE[tone]}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums">
        {clamped}
      </span>
    </div>
  );
}
