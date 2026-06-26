import type { Application } from "@/db/schema";
import { computeApplicationStats } from "./stats";

function app(over: Partial<Application>): Application {
  return {
    id: "id",
    profileId: null,
    company: "Acme",
    role: "Engineer",
    status: "saved",
    fitScore: null,
    jobUrl: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

describe("computeApplicationStats", () => {
  it("returns zeroed stats for an empty pipeline", () => {
    const stats = computeApplicationStats([]);
    expect(stats.total).toBe(0);
    expect(stats.submitted).toBe(0);
    expect(stats.offerRate).toBe(0);
    expect(stats.avgFitScore).toBeNull();
    expect(stats.byStatus.applied).toBe(0);
  });

  it("counts statuses, submitted, offer rate, and average fit", () => {
    const stats = computeApplicationStats([
      app({ status: "saved" }),
      app({ status: "applied", fitScore: 60 }),
      app({ status: "interview", fitScore: 80 }),
      app({ status: "offer", fitScore: 100 }),
      app({ status: "rejected" }),
    ]);
    expect(stats.total).toBe(5);
    expect(stats.byStatus).toEqual({ saved: 1, applied: 1, interview: 1, offer: 1, rejected: 1 });
    expect(stats.submitted).toBe(4); // all but "saved"
    expect(stats.offerRate).toBe(25); // 1 offer / 4 submitted
    expect(stats.avgFitScore).toBe(80); // mean of 60, 80, 100
  });

  it("ignores applications without a fit score in the average", () => {
    const stats = computeApplicationStats([app({ fitScore: null }), app({ fitScore: 50 })]);
    expect(stats.avgFitScore).toBe(50);
  });
});
