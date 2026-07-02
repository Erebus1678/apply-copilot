"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Application } from "@/db/schema";
import { fetchApplications } from "@/lib/applications/client";
import { computeApplicationStats } from "@/lib/applications/stats";
import { APPLICATION_STATUSES, STATUS_LABELS } from "@/lib/applications/status";
import { useActiveProfile } from "@/shared/profile/useProfileStore";

export function StatsView() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const profileId = useActiveProfile();

  useEffect(() => {
    if (!profileId) return; // no profile chosen yet — don't load anyone's data
    let active = true;
    fetchApplications(profileId)
      .then((data) => active && setApps(data))
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId]);

  if (!profileId)
    return (
      <p className="text-muted-foreground text-sm">
        Select your profile in the top-right to see your stats.
      </p>
    );
  if (loading) return <p className="text-muted-foreground text-sm">Loading your stats…</p>;
  if (error)
    return (
      <p className="text-destructive text-sm" role="alert">
        {error}
      </p>
    );
  if (apps.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        No applications yet — add some on the{" "}
        <Link href="/board" className="text-foreground underline">
          job tracker
        </Link>{" "}
        to see your stats.
      </p>
    );

  const stats = computeApplicationStats(apps);
  const cards = [
    { label: "Total", value: stats.total },
    { label: "Submitted", value: stats.submitted },
    { label: "Offers", value: stats.byStatus.offer },
    { label: "Offer rate", value: `${stats.offerRate}%` },
    { label: "Avg fit", value: stats.avgFitScore === null ? "—" : stats.avgFitScore },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
        aria-label="Key metrics"
      >
        {cards.map((c) => (
          <div
            key={c.label}
            className="border-border lift flex flex-col gap-1 rounded-lg border p-4"
          >
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {c.label}
            </span>
            <span className="text-3xl font-semibold tabular-nums">{c.value}</span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="pipeline-heading">
        <h2 id="pipeline-heading" className="text-sm font-semibold">
          Pipeline
        </h2>
        <ul className="flex flex-col gap-2">
          {APPLICATION_STATUSES.map((s) => {
            const count = stats.byStatus[s];
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <li key={s} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm">{STATUS_LABELS[s]}</span>
                <div
                  className="bg-muted h-2 flex-1 overflow-hidden rounded-full"
                  aria-hidden="true"
                >
                  <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-muted-foreground w-12 shrink-0 text-right text-sm tabular-nums">
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
