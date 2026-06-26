"use client";

import { useEffect, useRef } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cvReviewSchema } from "@/lib/ai/cv-review";
import { loadCv, saveCv } from "@/lib/cv-storage";
import { CvUpload } from "@/features/cv/CvUpload";
import { useProvider } from "@/features/provider/useProviderStore";
import { CvReviewResult } from "./CvReviewResult";

export function CvReviewView() {
  const cvRef = useRef<HTMLTextAreaElement>(null);
  const provider = useProvider();
  const { object, submit, stop, isLoading, error } = useObject({
    api: "/api/cv-review",
    schema: cvReviewSchema,
  });

  useEffect(() => {
    const stored = loadCv();
    if (stored && cvRef.current && !cvRef.current.value) cvRef.current.value = stored;
  }, []);

  function fillCv(text: string) {
    if (cvRef.current) cvRef.current.value = text;
    saveCv(text);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cv = cvRef.current?.value.trim() ?? "";
    if (cv.length < 50) return;
    submit({ cv, provider });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cv-review-cv" className="text-sm font-medium">
            Your CV{" "}
            <span className="text-muted-foreground font-normal">(saved on this device)</span>
          </label>
          <Textarea
            id="cv-review-cv"
            ref={cvRef}
            defaultValue=""
            onChange={(e) => saveCv(e.target.value)}
            placeholder="Paste your CV — or upload a PDF/DOCX below."
            className="min-h-72"
          />
          <CvUpload onExtracted={fillCv} disabled={isLoading} />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Checking…" : "Check my CV"}
          </Button>
          {isLoading && (
            <Button type="button" variant="outline" onClick={() => stop()}>
              Stop
            </Button>
          )}
        </div>
      </form>

      <div className="lg:border-border lg:border-l lg:pl-8">
        <CvReviewResult review={object} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}
