"use client";

import { useRef, useState } from "react";
import { uploadCv } from "@/lib/cv/client";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.docx,.txt,.md";

type Props = {
  onExtracted: (text: string) => void;
  disabled?: boolean;
};

export function CvUpload({ onExtracted, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    try {
      onExtracted(await uploadCv(file));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = ""; // allow re-picking the same file
    }
  }

  const label = busy ? "Reading…" : dragging ? "Drop to read" : "Drop a PDF/DOCX or click to upload";

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        aria-label="Upload CV file (PDF, DOCX, or TXT)"
        className={cn(
          "border-border text-muted-foreground hover:border-primary/60 hover:text-foreground flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-3 font-mono text-sm transition-colors disabled:opacity-60",
          dragging && "border-primary text-foreground bg-accent/40",
        )}
      >
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        aria-label="CV file"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
