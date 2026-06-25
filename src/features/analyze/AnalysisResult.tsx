import type { DeepPartial } from "ai";
import { Badge } from "@/components/ui/badge";
import type { Analysis } from "@/lib/ai/analysis";

type SeverityBadge = "success" | "warning" | "destructive";

function scoreTone(score: number): SeverityBadge {
  if (score >= 70) return "success";
  if (score >= 45) return "warning";
  return "destructive";
}

const TONE_STROKE: Record<SeverityBadge, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  destructive: "var(--destructive)",
};

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const tone = scoreTone(clamped);
  return (
    <div
      className="relative size-24 shrink-0"
      role="img"
      aria-label={`CV fit score: ${clamped} out of 100`}
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

const SEVERITY_VARIANT = {
  minor: "default",
  moderate: "warning",
  major: "destructive",
} as const;

type Props = {
  analysis: DeepPartial<Analysis> | undefined;
  isLoading: boolean;
  error: Error | undefined;
};

export function AnalysisResult({ analysis, isLoading, error }: Props) {
  if (error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {error.message || "Analysis failed. Check your AI provider and try again."}
      </p>
    );
  }

  if (!analysis && !isLoading) {
    return (
      <p className="text-muted-foreground text-sm">
        Paste a job description and run the analysis to see the tech stack, seniority, and your fit.
      </p>
    );
  }

  const tech = analysis?.techStack?.filter(Boolean) ?? [];
  const responsibilities = analysis?.responsibilities?.filter(Boolean) ?? [];
  const fit = analysis?.fit;

  return (
    <div className="flex flex-col gap-6" aria-busy={isLoading} aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        {analysis?.seniority && (
          <Badge variant="primary" className="capitalize">
            {analysis.seniority}
          </Badge>
        )}
        {analysis?.archetype && <span className="text-sm font-medium">{analysis.archetype}</span>}
      </div>

      {tech.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Tech stack
          </h3>
          <ul className="flex flex-wrap gap-2">
            {tech.map((t, i) => (
              <li key={i}>
                <Badge variant={t?.importance === "required" ? "primary" : "outline"}>
                  {t?.name}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {responsibilities.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Responsibilities
          </h3>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
            {responsibilities.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      )}

      {fit && (
        <section className="border-border flex flex-col gap-4 rounded-lg border p-4">
          <div className="flex items-center gap-4">
            {typeof fit.score === "number" && <ScoreRing score={fit.score} />}
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">CV fit</h3>
              {fit.summary && <p className="text-muted-foreground text-sm">{fit.summary}</p>}
            </div>
          </div>

          {(fit.matched?.filter(Boolean).length ?? 0) > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Matched
              </h4>
              <ul className="flex flex-wrap gap-2">
                {fit.matched?.filter(Boolean).map((m, i) => (
                  <li key={i}>
                    <Badge variant="success">{m}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(fit.gaps?.filter(Boolean).length ?? 0) > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Gaps
              </h4>
              <ul className="flex flex-col gap-1.5 text-sm">
                {fit.gaps?.filter(Boolean).map((g, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Badge variant={SEVERITY_VARIANT[g?.severity ?? "minor"]}>
                      {g?.severity ?? "minor"}
                    </Badge>
                    <span>{g?.item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
