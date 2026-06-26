"use client";

import { useEffect, useRef, useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CompressionHint } from "@/components/compression-hint";
import { StreamingIndicator } from "@/components/streaming-indicator";
import { cleanAiText } from "@/lib/ai/clean-text";
import { loadCv, saveCv } from "@/lib/cv-storage";
import { CvUpload } from "@/features/cv/CvUpload";
import { overrideFor, useProvider, useProviderConfig } from "@/features/provider/useProviderStore";

export function CoverLetterView() {
  const [jd, setJd] = useState("");
  const [cvError, setCvError] = useState("");
  const [copied, setCopied] = useState(false);
  const cvRef = useRef<HTMLTextAreaElement>(null);
  const provider = useProvider();
  const providerConfig = useProviderConfig();

  const { completion, complete, setCompletion, isLoading, stop, error } = useCompletion({
    api: "/api/cover-letter",
    streamProtocol: "text",
    // Deterministic de-slop once the stream settles (preamble, fences, markdown).
    onFinish: (_prompt, text) => setCompletion(cleanAiText(text)),
  });

  useEffect(() => {
    const stored = loadCv();
    if (stored && cvRef.current && !cvRef.current.value) cvRef.current.value = stored;
  }, []);

  function fillCv(text: string) {
    if (cvRef.current) cvRef.current.value = text;
    saveCv(text);
    setCvError("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cv = cvRef.current?.value.trim() ?? "";
    if (jd.trim().length < 20) return;
    if (cv.length < 20) {
      setCvError("Add your CV (saved on this device) to ground the letter.");
      return;
    }
    setCvError("");
    setCopied(false);
    void complete("", { body: { jd: jd.trim(), cv, ...overrideFor(provider, providerConfig) } });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(completion);
      setCopied(true);
    } catch {
      // best-effort copy — clipboard can reject (denied permission,
      // non-secure context). The draft stays selectable, so we just no-op.
    }
  }

  // Reset the "Copied" label, cleaning up if the component unmounts first.
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const canSubmit = jd.trim().length >= 20 && !isLoading;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cl-jd" className="text-sm font-medium">
            Job description
          </label>
          <Textarea
            id="cl-jd"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description you're applying to…"
            className="min-h-56"
            required
          />
          <CompressionHint sources={[jd]} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="cl-cv" className="text-sm font-medium">
            Your CV{" "}
            <span className="text-muted-foreground font-normal">(saved on this device)</span>
          </label>
          <Textarea
            id="cl-cv"
            ref={cvRef}
            defaultValue=""
            onChange={(e) => saveCv(e.target.value)}
            placeholder="Paste your CV once — the letter is grounded strictly in it."
            className="min-h-40"
          />
          <CvUpload onExtracted={fillCv} disabled={isLoading} />
          {cvError && (
            <p className="text-destructive text-sm" role="alert">
              {cvError}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={!canSubmit}>
            {isLoading ? "Drafting…" : completion ? "Redraft" : "Draft letter"}
          </Button>
          {isLoading && (
            <Button type="button" variant="outline" onClick={() => stop()}>
              Stop
            </Button>
          )}
        </div>
      </form>

      <div className="lg:border-border flex flex-col gap-3 lg:border-l lg:pl-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold">Draft</h2>
            {isLoading && <StreamingIndicator label="Drafting…" />}
          </div>
          {completion && !isLoading && (
            <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </div>

        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error.message || "Generation failed. Check your AI provider and try again."}
          </p>
        )}

        {completion || isLoading ? (
          <Textarea
            aria-label="Cover letter draft"
            value={completion}
            onChange={(e) => setCompletion(e.target.value)}
            className="min-h-[28rem] flex-1"
            aria-busy={isLoading}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            Paste a job description and your CV, then draft a tailored letter — streamed and
            editable, with the AI-slop filtered out.
          </p>
        )}
      </div>
    </div>
  );
}
