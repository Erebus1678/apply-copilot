import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { StatsView } from "@/features/stats/StatsView";

export const metadata: Metadata = {
  title: "Stats · Apply Copilot",
};

export default function StatsPage() {
  return (
    <main className="reveal mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <PageHeading eyebrow="Pipeline · Stats" title="Your application stats">
        A read-only snapshot of your pipeline — totals, offer rate, average fit, and how your
        applications are distributed across stages.
      </PageHeading>
      <StatsView />
    </main>
  );
}
