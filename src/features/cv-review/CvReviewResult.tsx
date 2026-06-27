import type { DeepPartial } from "ai";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/score-ring";
import { StreamingIndicator } from "@/components/streaming-indicator";
import type { CvReview } from "@/lib/ai/cv-review";

const SEVERITY_VARIANT = {
  minor: "default",
  moderate: "warning",
  major: "destructive",
} as const;

const CATEGORY_LABEL: Record<string, string> = {
  ats: "ATS",
  content: "Content",
  clarity: "Clarity",
  spelling: "Spelling",
  formatting: "Formatting",
};

type Props = {
  review: DeepPartial<CvReview> | undefined;
  isLoading: boolean;
  error: Error | undefined;
};

export function CvReviewResult({ review, isLoading, error }: Props) {
  if (error) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {error.message || "Review failed. Check your AI provider and try again."}
      </p>
    );
  }

  if (!review && !isLoading) {
    return (
      <p className="text-muted-foreground text-sm">
        Paste or upload your CV and run the check to see an ATS score, concrete fixes, and what
        already works.
      </p>
    );
  }

  // Before the first tokens arrive there's nothing to render — show a skeleton
  // so the panel doesn't sit empty under a lone "Checking…" dot.
  const hasStarted = typeof review?.atsScore === "number" || Boolean(review?.summary);
  if (isLoading && !hasStarted) return <CvReviewSkeleton />;

  const issues = review?.issues?.filter(Boolean) ?? [];
  const strengths = review?.strengths?.filter(Boolean) ?? [];

  return (
    <div className="flex flex-col gap-6" aria-busy={isLoading} aria-live="polite">
      {isLoading && <StreamingIndicator label="Checking…" />}
      <div className="flex items-center gap-4">
        {typeof review?.atsScore === "number" && (
          <ScoreRing score={review.atsScore} label="ATS-friendliness score" />
        )}
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">ATS-friendliness</h3>
          {review?.summary && <p className="text-muted-foreground text-sm">{review.summary}</p>}
        </div>
      </div>

      {issues.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            What to fix
          </h3>
          <ul className="flex flex-col gap-3">
            {issues.map((issue, i) => (
              <li key={i} className="border-border flex flex-col gap-1 rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={SEVERITY_VARIANT[issue?.severity ?? "minor"]}>
                    {issue?.severity ?? "minor"}
                  </Badge>
                  {issue?.category && (
                    <Badge variant="outline">
                      {CATEGORY_LABEL[issue.category] ?? issue.category}
                    </Badge>
                  )}
                  {issue?.problem && <span className="text-sm font-medium">{issue.problem}</span>}
                </div>
                {issue?.fix && <p className="text-muted-foreground text-sm">{issue.fix}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {strengths.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Strengths
          </h3>
          <ul className="flex flex-wrap gap-2">
            {strengths.map((s, i) => (
              <li key={i}>
                <Badge variant="success">{s}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CvReviewSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <StreamingIndicator label="Checking…" />
      <div className="flex items-center gap-4">
        <div className="bg-muted size-16 shrink-0 animate-pulse rounded-full" />
        <div className="flex w-full flex-col gap-2">
          <div className="bg-muted h-4 w-32 animate-pulse rounded" />
          <div className="bg-muted h-3 w-full animate-pulse rounded" />
          <div className="bg-muted h-3 w-4/5 animate-pulse rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-border flex flex-col gap-2 rounded-lg border p-3">
            <div className="bg-muted h-3 w-24 animate-pulse rounded" />
            <div className="bg-muted h-3 w-full animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
