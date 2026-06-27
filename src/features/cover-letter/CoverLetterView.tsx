"use client";

import { useEffect, useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StreamingIndicator } from "@/components/streaming-indicator";
import { cleanAiText } from "@/lib/ai/clean-text";
import { CvInput } from "@/features/cv/CvInput";
import { JdInput } from "@/features/jd/JdInput";
import { useCurrentCv } from "@/features/cv/cvStore";
import { overrideFor, useProvider, useProviderConfig } from "@/features/provider/useProviderStore";

export function CoverLetterView() {
  const [jd, setJd] = useState("");
  const [cvError, setCvError] = useState("");
  const [copied, setCopied] = useState(false);
  const { cv } = useCurrentCv();
  const provider = useProvider();
  const providerConfig = useProviderConfig();

  const { completion, complete, setCompletion, isLoading, stop, error } = useCompletion({
    api: "/api/cover-letter",
    streamProtocol: "text",
    // Deterministic de-slop once the stream settles (preamble, fences, markdown).
    onFinish: (_prompt, text) => setCompletion(cleanAiText(text)),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const cvText = cv?.text.trim() ?? "";
    if (jd.trim().length < 20) return;
    if (cvText.length < 20) {
      setCvError("Add your CV (saved on this device) to ground the letter.");
      return;
    }
    setCvError("");
    setCopied(false);
    void complete("", {
      body: { jd: jd.trim(), cv: cvText, ...overrideFor(provider, providerConfig) },
    });
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
        <JdInput
          id="cl-jd"
          value={jd}
          onChange={setJd}
          placeholder="Paste the job description, drop a file/screenshot, or fetch a link…"
          disabled={isLoading}
          textareaClassName="min-h-56"
        />

        <div className="flex flex-col gap-1.5">
          <CvInput
            id="cl-cv"
            placeholder="Paste your CV once — the letter is grounded strictly in it."
            disabled={isLoading}
          />
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
