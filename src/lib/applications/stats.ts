import type { Application } from "@/db/schema";
import { APPLICATION_STATUSES, type ApplicationStatus } from "./status";

export type ApplicationStats = {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  /** Applications actually sent out (everything past "saved"). */
  submitted: number;
  /** Share of submitted applications that became offers, 0-100. */
  offerRate: number;
  /** Mean fit score across applications that have one, or null. */
  avgFitScore: number | null;
};

// stats are derived from current status only — there's no history
// table, so a rejected app that once interviewed reads as "rejected". Honest
// for a personal tracker; add stage history if real funnel rates are needed.
export function computeApplicationStats(apps: readonly Application[]): ApplicationStats {
  const byStatus = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) as Record<
    ApplicationStatus,
    number
  >;

  let fitSum = 0;
  let fitCount = 0;
  for (const app of apps) {
    byStatus[app.status] += 1;
    if (typeof app.fitScore === "number") {
      fitSum += app.fitScore;
      fitCount += 1;
    }
  }

  const submitted = apps.length - byStatus.saved;
  return {
    total: apps.length,
    byStatus,
    submitted,
    offerRate: submitted > 0 ? Math.round((byStatus.offer / submitted) * 100) : 0,
    avgFitScore: fitCount > 0 ? Math.round(fitSum / fitCount) : null,
  };
}
