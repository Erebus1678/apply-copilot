"use client";

import { useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { cvReviewSchema } from "@/lib/ai/cv-review";
import { CvInput } from "@/features/cv/CvInput";
import { useCurrentCv } from "@/features/cv/cvStore";
import { overrideFor, useProvider, useProviderConfig } from "@/features/provider/useProviderStore";
import { CvReviewResult } from "./CvReviewResult";

export function CvReviewView() {
  const [notice, setNotice] = useState("");
  const [thorough, setThorough] = useState(false);
  const { cv } = useCurrentCv();
  const provider = useProvider();
  const providerConfig = useProviderConfig();
  const { object, submit, stop, isLoading, error } = useObject({
    api: "/api/cv-review",
    schema: cvReviewSchema,
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = cv?.text.trim() ?? "";
    if (text.length < 50) {
      setNotice("Add at least 50 characters of your CV — paste it above, or upload a PDF/DOCX.");
      return;
    }
    setNotice("");
    submit({
      cv: text,
      layout: cv?.layout ?? null,
      thorough,
      ...overrideFor(provider, providerConfig),
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CvInput
          id="cv-review-cv"
          placeholder="Paste your CV — or upload a PDF/DOCX below."
          disabled={isLoading}
        />

        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={thorough}
            onChange={(e) => setThorough(e.target.checked)}
            disabled={isLoading}
            className="border-input size-4 rounded"
          />
          Thorough — extract structure first, then review (slower, fewer slips)
        </label>

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

        {notice && (
          <p className="text-destructive text-sm" role="alert">
            {notice}
          </p>
        )}
      </form>

      <div className="lg:border-border lg:border-l lg:pl-8">
        <CvReviewResult review={object} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}
