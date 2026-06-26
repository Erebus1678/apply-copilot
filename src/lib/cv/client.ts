/** Upload a CV file and get back its extracted plain text. */
export async function uploadCv(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/cv/extract", { method: "POST", body: form });
  const data = (await res.json().catch(() => null)) as { text?: string; error?: string } | null;

  if (!res.ok || !data?.text) {
    throw new Error(data?.error ?? "Could not read the file.");
  }
  return data.text;
}
