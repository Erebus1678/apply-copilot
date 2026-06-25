import type { Metadata } from "next";
import { BoardView } from "@/features/board/BoardView";

export const metadata: Metadata = {
  title: "Pipeline · Apply Copilot",
};

export default function BoardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your pipeline</h1>
        <p className="text-muted-foreground max-w-2xl text-pretty">
          Track every application through its stages — saved, applied, interviewing, and beyond.
          Persisted to your database.
        </p>
      </header>
      <BoardView />
    </main>
  );
}
