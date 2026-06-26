import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { CvReviewView } from "@/features/cv-review/CvReviewView";

export const metadata: Metadata = {
  title: "CV check · Apply Copilot",
};

export default function CvPage() {
  return (
    <PageShell
      eyebrow="01 · CV check"
      title="Is your CV ATS-ready?"
      intro="Get an ATS-friendliness score, the concrete things to fix (including spelling), and what your CV already does well — streamed, and grounded only in what you paste."
    >
      <CvReviewView />
    </PageShell>
  );
}
