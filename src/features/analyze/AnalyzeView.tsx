"use client";

import { useEffect, useRef, useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CompressionHint } from "@/components/compression-hint";
import { analysisSchema } from "@/lib/ai/analysis";
import { loadCv, saveCv } from "@/lib/cv-storage";
import { CvUpload } from "@/features/cv/CvUpload";
import { overrideFor, useProvider, useProviderConfig } from "@/features/provider/useProviderStore";
import { AnalysisResult } from "./AnalysisResult";

export function AnalyzeView() {
  const [jd, setJd] = useState("");
  const cvRef = useRef<HTMLTextAreaElement>(null);
  const provider = useProvider();
  const providerConfig = useProviderConfig();
  const { object, submit, stop, isLoading, error } = useObject({
    api: "/api/analyze",
    schema: analysisSchema,
  });

  // Restore the once-entered CV from local storage (no DB until Phase 4).
  // Uncontrolled textarea + imperative load keeps it SSR-safe and avoids
  // setting React state from an effect.
  useEffect(() => {
    const stored = loadCv();
    // Only restore into an empty field so a remount never clobbers a live edit.
    if (stored && cvRef.current && !cvRef.current.value) cvRef.current.value = stored;
  }, []);

  function fillCv(text: string) {
    if (cvRef.current) cvRef.current.value = text;
    saveCv(text);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (jd.trim().length < 20) return;
    const cv = cvRef.current?.value.trim();
    submit({ jd: jd.trim(), cv: cv || undefined, ...overrideFor(provider, providerConfig) });
  }

  const canSubmit = jd.trim().length >= 20 && !isLoading;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="jd" className="text-sm font-medium">
            Job description
          </label>
          <Textarea
            id="jd"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the full job description…"
            className="min-h-64"
            required
          />
          <CompressionHint sources={[jd]} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cv" className="text-sm font-medium">
            Your CV{" "}
            <span className="text-muted-foreground font-normal">(saved on this device)</span>
          </label>
          <Textarea
            id="cv"
            ref={cvRef}
            defaultValue=""
            onChange={(e) => saveCv(e.target.value)}
            placeholder="Paste your CV once — it powers the fit score and gaps."
            className="min-h-40"
          />
          <CvUpload onExtracted={fillCv} disabled={isLoading} />
        </div>

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
