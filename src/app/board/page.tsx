import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { BoardView } from "@/features/board/BoardView";

export const metadata: Metadata = {
  title: "Job Tracker · Apply Copilot",
};

export default function BoardPage() {
  return (
    <PageShell
      eyebrow="04 · Job Tracker"
      title="Your job tracker"
      intro="Track every application through its stages — saved, applied, interviewing, and beyond. Persisted to your database."
      wide
    >
      <BoardView />
    </PageShell>
  );
}
