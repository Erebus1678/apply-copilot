"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { analysisSchema } from "@/lib/ai/analysis";
import { DEMO_JD, isDemoEnabled } from "@/lib/ai/demo";
import { CvInput } from "@/shared/cv/CvInput";
import { JdInput } from "@/shared/jd/JdInput";
import { useCurrentCv } from "@/shared/cv/cvStore";
import { useProviderOverride } from "@/shared/provider/useProviderStore";
import { AnalysisResult } from "./AnalysisResult";

export function AnalyzeView() {
  const [jd, setJd] = useState("");
  const { cv } = useCurrentCv();
  const providerOverride = useProviderOverride();
  const searchParams = useSearchParams();
  const hasAutoRun = useRef(false);
  const { object, submit, stop, isLoading, error } = useObject({
    api: "/api/analyze",
    schema: analysisSchema,
  });

  // One-time bootstrap from the ?demo=1 URL param, guarded by hasAutoRun so it
  // never cascades past this single run — not state synchronized from props.
  // Deliberately does NOT touch the persistent CV store: the fixture's `fit`
  // renders regardless, and the route short-circuits before reading `cv`, so a
  // returning user's saved CV is never overwritten.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (hasAutoRun.current) return;
    if (!isDemoEnabled() || searchParams.get("demo") !== "1") return;
    hasAutoRun.current = true;
    setJd(DEMO_JD);
    submit({ jd: DEMO_JD, demo: true });
    // submit is store-backed and stable; re-running on its identity would defeat "once".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (jd.trim().length < 20) return;
    const cvText = cv?.text.trim();
    submit({ jd: jd.trim(), cv: cvText || undefined, ...providerOverride });
  }

  const canSubmit = jd.trim().length >= 20 && !isLoading;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="border-border bg-background/95 sticky top-16 z-10 -mx-1 flex flex-wrap gap-2 border-b px-1 py-3 backdrop-blur">
          <Button type="submit" disabled={!canSubmit}>
            {isLoading ? "Analyzing…" : "Analyze"}
          </Button>
          {isLoading && (
            <Button type="button" variant="outline" onClick={() => stop()}>
              Stop
            </Button>
          )}
        </div>

        <JdInput
          id="jd"
          value={jd}
          onChange={setJd}
          placeholder="Paste the full job description, drop a file/screenshot, or fetch a link…"
          disabled={isLoading}
        />

        <CvInput
          id="cv"
          placeholder="Paste your CV once — it powers the fit score and gaps."
          disabled={isLoading}
        />
      </form>

      <div className="lg:border-border lg:border-l lg:pl-8">
        <AnalysisResult analysis={object} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}
