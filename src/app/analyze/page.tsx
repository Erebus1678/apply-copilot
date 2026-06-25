import type { Metadata } from "next";
import { AnalyzeView } from "@/features/analyze/AnalyzeView";

export const metadata: Metadata = {
  title: "Analyze a job description · Apply Copilot",
};

export default function AnalyzePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Analyze a job description</h1>
        <p className="text-muted-foreground max-w-2xl text-pretty">
          Paste a job description to extract its tech stack, seniority, and archetype. Add your CV
          to score the fit and surface concrete gaps — streamed live, on your own model.
        </p>
      </header>
      <AnalyzeView />
    </main>
  );
}
