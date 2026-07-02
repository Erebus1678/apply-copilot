import { render, screen } from "@testing-library/react";
import type { DeepPartial } from "ai";
import { AnalysisResult } from "./AnalysisResult";
import type { Analysis } from "@/lib/ai/analysis";

describe("AnalysisResult", () => {
  it("shows the empty prompt when idle", () => {
    render(<AnalysisResult analysis={undefined} isLoading={false} error={undefined} />);
    expect(screen.getByText(/paste a job description and run the analysis/i)).toBeInTheDocument();
  });

  it("shows an error message", () => {
    render(<AnalysisResult analysis={undefined} isLoading={false} error={new Error("boom")} />);
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
  });

  it("renders tech, seniority, and a labelled fit ring", () => {
    const analysis: DeepPartial<Analysis> = {
      techStack: [
        { name: "React", importance: "required" },
        { name: "Vue", importance: "preferred" },
      ],
      seniority: "mid",
      archetype: "Frontend engineer",
      responsibilities: ["Build UIs"],
      fit: {
        score: 30,
        matched: ["React"],
        gaps: [{ item: "AWS", severity: "minor" }],
        summary: "Low match.",
      },
    };
    render(<AnalysisResult analysis={analysis} isLoading={true} error={undefined} />);
    expect(screen.getByText("Vue")).toBeInTheDocument();
    expect(screen.getByText("mid")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /cv fit score: 30 out of 100/i })).toBeInTheDocument();
  });

  it("renders without a fit section when fit is null (JD analyzed without a CV)", () => {
    const analysis: DeepPartial<Analysis> = {
      techStack: [{ name: "Go", importance: "required" }],
      seniority: "senior",
      fit: null,
    };
    // Must not throw on null fit; the tech stack still renders, no fit ring.
    render(<AnalysisResult analysis={analysis} isLoading={false} error={undefined} />);
    expect(screen.getByText("Go")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /cv fit score/i })).not.toBeInTheDocument();
  });
});
