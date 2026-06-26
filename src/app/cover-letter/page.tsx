import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { CoverLetterView } from "@/features/cover-letter/CoverLetterView";

export const metadata: Metadata = {
  title: "Draft a cover letter · Apply Copilot",
};

export default function CoverLetterPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <PageHeading eyebrow="03 · Draft" title="Draft a cover letter">
        A tailored letter grounded strictly in your CV and the role — streamed live, editable, and
        free of the usual AI clichés.
      </PageHeading>
      <CoverLetterView />
    </main>
  );
}
