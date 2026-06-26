import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { BoardView } from "@/features/board/BoardView";

export const metadata: Metadata = {
  title: "Pipeline · Apply Copilot",
};

export default function BoardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <PageHeading eyebrow="04 · Pipeline" title="Your pipeline">
        Track every application through its stages — saved, applied, interviewing, and beyond.
        Persisted to your database.
      </PageHeading>
      <BoardView />
    </main>
  );
}
