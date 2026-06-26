import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { AnalyzeView } from "@/features/analyze/AnalyzeView";

export const metadata: Metadata = {
  title: "Analyze a job description · Apply Copilot",
};

export default function AnalyzePage() {
  return (
    <main className="reveal mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <PageHeading eyebrow="01 · Analyze" title="Analyze a job description">
        Paste a job description to extract its tech stack, seniority, and archetype. Add your CV to
        score the fit and surface concrete gaps — streamed live, on your own model.
      </PageHeading>
      <AnalyzeView />
    </main>
  );
}
