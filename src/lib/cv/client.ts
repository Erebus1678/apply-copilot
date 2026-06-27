import type { LayoutReport } from "./layout";

export type UploadedCv = { text: string; layout: LayoutReport | null };

/** Upload a CV file and get back its extracted text + structural layout report. */
export async function uploadCv(file: File): Promise<UploadedCv> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/cv/extract", { method: "POST", body: form });
  const data = (await res.json().catch(() => null)) as {
    text?: string;
    layout?: LayoutReport;
    error?: string;
  } | null;

  if (!res.ok || !data?.text) {
    throw new Error(data?.error ?? "Could not read the file.");
  }
  return { text: data.text, layout: data.layout ?? null };
}
