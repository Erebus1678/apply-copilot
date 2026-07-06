import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { StatsView } from "@/features/stats/StatsView";

export const metadata: Metadata = {
  title: "Stats · Apply Copilot",
};

export default function StatsPage() {
  return (
    <PageShell
      eyebrow="Pipeline · Stats"
      title="Your application stats"
      intro="A read-only snapshot of your pipeline, totals, offer rate, average fit, and how your applications are distributed across stages."
    >
      <StatsView />
    </PageShell>
  );
}
