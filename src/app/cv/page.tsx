import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { CvReviewView } from "@/features/cv-review/CvReviewView";

export const metadata: Metadata = {
  title: "CV check · Apply Copilot",
};

export default function CvPage() {
  return (
    <main className="reveal mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <PageHeading eyebrow="Résumé · CV check" title="Is your CV ATS-ready?">
        Get an ATS-friendliness score, the concrete things to fix (including spelling), and what
        your CV already does well — streamed, and grounded only in what you paste.
      </PageHeading>
      <CvReviewView />
    </main>
  );
}
