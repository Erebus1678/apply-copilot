"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { CompressionHint } from "@/components/compression-hint";
import { cn } from "@/lib/utils";
import { extractJdFile, extractJdImage, extractJdUrl, isImageFile } from "@/lib/jd/client";
import { overrideFor, useProvider, useProviderConfig } from "@/features/provider/useProviderStore";

const ACCEPT = ".pdf,.docx,.txt,.md,image/*";

type Busy = "" | "file" | "image" | "url";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  textareaClassName?: string;
};

/**
 * The one JD input, shared by analyze + cover-letter. A JD is just text, so any
 * source — paste, file (PDF/DOCX/TXT), screenshot, or a job link — is resolved to
 * text that fills the textarea (still editable). No preview/persistence: a JD is
 * per-application and transient.
 */
export function JdInput({ id, value, onChange, placeholder, disabled, textareaClassName }: Props) {
  const provider = useProvider();
  const providerConfig = useProviderConfig();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<Busy>("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  const importing = busy !== "";

  async function run(kind: Exclude<Busy, "">, fn: () => Promise<string>) {
    if (importing) return;
    setBusy(kind);
    setError("");
    try {
      onChange(await fn());
      if (kind === "url") setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read that.");
    } finally {
      setBusy("");
      if (inputRef.current) inputRef.current.value = ""; // allow re-picking the same file
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (isImageFile(file)) {
      void run("image", () => extractJdImage(file, overrideFor(provider, providerConfig)));
    } else {
      void run("file", () => extractJdFile(file));
    }
  }

  const dropLabel =
    busy === "file"
      ? "Reading…"
      : busy === "image"
        ? "Reading screenshot…"
        : dragging
          ? "Drop to read"
          : "Drop a JD file / screenshot, or click";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        Job description
      </label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("min-h-64", textareaClassName)}
        disabled={disabled}
        required
      />
      <CompressionHint sources={[value]} />

      <button
        type="button"
        disabled={disabled || importing}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        aria-label="Upload a job description file or screenshot"
        className={cn(
          "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-3 font-mono text-sm transition-colors disabled:opacity-60",
          dragging && "border-primary text-foreground bg-accent/40",
        )}
      >
        {dropLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        aria-label="Job description file"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = url.trim();
          if (trimmed) void run("url", () => extractJdUrl(trimmed));
        }}
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="…or paste a job link"
          aria-label="Job description URL"
          disabled={disabled || importing}
          className="border-border bg-background focus-visible:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || importing || !url.trim()}
          className="border-border shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          {busy === "url" ? "Fetching…" : "Fetch"}
        </button>
      </form>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
