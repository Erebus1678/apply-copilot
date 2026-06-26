import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AnalyzeView } from "@/features/analyze/AnalyzeView";

export const metadata: Metadata = {
  title: "Analyze a job description · Apply Copilot",
};

export default function AnalyzePage() {
  return (
    <PageShell
      eyebrow="02 · Analyze"
      title="Analyze a job description"
      intro="Paste a job description to extract its tech stack, seniority, and archetype. Add your CV to score the fit and surface concrete gaps — streamed live, on your own model."
    >
      <AnalyzeView />
    </PageShell>
  );
}
