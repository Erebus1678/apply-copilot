import type { Metadata } from "next";
import { CoverLetterView } from "@/features/cover-letter/CoverLetterView";

export const metadata: Metadata = {
  title: "Draft a cover letter · Apply Copilot",
};

export default function CoverLetterPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Draft a cover letter</h1>
        <p className="text-muted-foreground max-w-2xl text-pretty">
          A tailored letter grounded strictly in your CV and the role — streamed live, editable, and
          free of the usual AI clichés.
        </p>
      </header>
      <CoverLetterView />
    </main>
  );
}
