"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CvUpload } from "./CvUpload";
import { useCurrentCv } from "./cvStore";

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

type Props = {
  id: string;
  placeholder: string;
  disabled?: boolean;
  className?: string;
};

/**
 * The one CV input, shared by every tool. When the CV is an uploaded file we show
 * its real preview (not the flattened text); pasted text shows a textarea. State
 * lives in the per-profile IndexedDB store, so it stays coherent across tools,
 * navigation, and reloads.
 */
export function CvInput({ id, placeholder, disabled, className }: Props) {
  const { cv, setUpload, setText, clear } = useCurrentCv();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        Your CV <span className="text-muted-foreground font-normal">(saved on this device)</span>
      </label>

      {cv?.kind === "file" && cv.file ? (
        <FilePreview file={cv.file} text={cv.text} onRemove={clear} disabled={disabled} />
      ) : (
        <>
          <Textarea
            id={id}
            value={cv?.kind === "text" ? cv.text : ""}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="min-h-40"
          />
          <CvUpload
            onExtracted={(text, layout, file) => setUpload(file, text, layout)}
            disabled={disabled}
          />
        </>
      )}
    </div>
  );
}

function FilePreview({
  file,
  text,
  onRemove,
  disabled,
}: {
  file: File;
  text: string;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const docxRef = useRef<HTMLDivElement>(null);
  const pdf = isPdf(file);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // PDF: native browser viewer via a blob URL. The URL must be created inside the
  // effect (not useMemo): React StrictMode mounts → cleans up → mounts again, and
  // the cleanup revokes the URL. A memoized URL wouldn't be re-created on the
  // second mount, leaving the iframe pointing at a dead blob ("preview unavailable").
  // The blob is re-wrapped with an explicit application/pdf type so the browser
  // never has to guess the content type from the original File.
  useEffect(() => {
    if (!pdf || typeof URL.createObjectURL !== "function") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- blob URL lifecycle must live in the effect so StrictMode re-creates it after cleanup revokes it
      setPdfUrl(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([file], { type: "application/pdf" }));
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, pdf]);

  // DOCX: docx-preview, lazy-loaded and fit to the container width.
  useEffect(() => {
    if (pdf || !docxRef.current) return;
    let cancelled = false;
    const el = docxRef.current;
    void import("docx-preview")
      .then(({ renderAsync }) => {
        if (cancelled) return;
        el.replaceChildren();
        return renderAsync(file, el, undefined, {
          inWrapper: true,
          ignoreWidth: true,
          ignoreHeight: true,
          breakPages: false,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [file, pdf]);

  return (
    <div className="flex flex-col gap-2">
      <div className="border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm">
        <span className="truncate font-medium" title={file.name}>
          {file.name}
        </span>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="text-muted-foreground hover:text-destructive shrink-0 text-xs disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      {pdf ? (
        <div className="flex flex-col gap-1.5">
          <iframe
            src={pdfUrl ?? undefined}
            title="Uploaded PDF preview"
            className="border-border h-96 w-full rounded-md border"
          />
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground self-start text-xs underline"
            >
              Open in a new tab
            </a>
          )}
        </div>
      ) : (
        <div
          ref={docxRef}
          aria-label="Uploaded DOCX preview"
          className="border-border h-96 w-full overflow-auto rounded-md border bg-white"
        />
      )}

      <details className="text-sm">
        <summary className="text-muted-foreground hover:text-foreground cursor-pointer">
          View extracted text (what the AI reads)
        </summary>
        <Textarea readOnly value={text} className="mt-2 min-h-32" aria-label="Extracted CV text" />
      </details>
    </div>
  );
}
