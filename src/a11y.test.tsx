import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import type { DeepPartial } from "ai";
import Home from "@/app/page";
import { ApplicationCard } from "@/features/board/ApplicationCard";
import { AnalysisResult } from "@/features/analyze/AnalysisResult";
import type { Application } from "@/db/schema";
import type { Analysis } from "@/lib/ai/analysis";

const app: Application = {
  id: "a1",
  profileId: null,
  company: "Acme",
  role: "Senior Frontend Engineer",
  status: "applied",
  fitScore: 82,
  salary: null,
  grade: null,
  jobUrl: "https://jobs.acme.com/1",
  notes: "Strong match",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const analysis: DeepPartial<Analysis> = {
  techStack: [{ name: "React", importance: "required" }],
  seniority: "senior",
  archetype: "Product-focused frontend engineer",
  responsibilities: ["Build streaming UIs"],
  fit: {
    score: 80,
    matched: ["React", "TypeScript"],
    gaps: [{ item: "AWS", severity: "major" }],
    summary: "Strong frontend match with a cloud gap.",
  },
};

describe("accessibility", () => {
  it("home page has no axe violations", async () => {
    const { container } = render(<Home />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("application card has no axe violations", async () => {
    const { container } = render(
      <main>
        <ApplicationCard
          app={app}
          onStatusChange={() => {}}
          onDelete={() => {}}
          onDragStart={() => {}}
          onDragEnd={() => {}}
          dragging={false}
        />
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("analysis result has no axe violations", async () => {
    const { container } = render(
      <main>
        <AnalysisResult analysis={analysis} isLoading={false} error={undefined} />
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
