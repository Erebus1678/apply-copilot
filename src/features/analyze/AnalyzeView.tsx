"use client";

import { useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { analysisSchema } from "@/lib/ai/analysis";
import { CvInput } from "@/features/cv/CvInput";
import { JdInput } from "@/features/jd/JdInput";
import { useCurrentCv } from "@/features/cv/cvStore";
import { overrideFor, useProvider, useProviderConfig } from "@/features/provider/useProviderStore";
import { AnalysisResult } from "./AnalysisResult";

export function AnalyzeView() {
  const [jd, setJd] = useState("");
  const { cv } = useCurrentCv();
  const provider = useProvider();
  const providerConfig = useProviderConfig();
  const { object, submit, stop, isLoading, error } = useObject({
    api: "/api/analyze",
    schema: analysisSchema,
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (jd.trim().length < 20) return;
    const cvText = cv?.text.trim();
    submit({ jd: jd.trim(), cv: cvText || undefined, ...overrideFor(provider, providerConfig) });
  }

  const canSubmit = jd.trim().length >= 20 && !isLoading;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        <div className="flex gap-2">
          <Button type="submit" disabled={!canSubmit}>
            {isLoading ? "Analyzing…" : "Analyze"}
          </Button>
          {isLoading && (
            <Button type="button" variant="outline" onClick={() => stop()}>
              Stop
            </Button>
          )}
        </div>
      </form>

      <div className="lg:border-border lg:border-l lg:pl-8">
        <AnalysisResult analysis={object} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}
