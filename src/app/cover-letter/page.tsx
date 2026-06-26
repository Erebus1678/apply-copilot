import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { CoverLetterView } from "@/features/cover-letter/CoverLetterView";

export const metadata: Metadata = {
  title: "Draft a cover letter · Apply Copilot",
};

export default function CoverLetterPage() {
  return (
    <PageShell
      eyebrow="03 · Draft"
      title="Draft a cover letter"
      intro="A tailored letter grounded strictly in your CV and the role — streamed live, editable, and free of the usual AI clichés."
    >
      <CoverLetterView />
    </PageShell>
  );
}
