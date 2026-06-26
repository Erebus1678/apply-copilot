import { render, screen } from "@testing-library/react";
import { CvReviewResult } from "./CvReviewResult";

describe("CvReviewResult", () => {
  it("shows the empty prompt before any review", () => {
    render(<CvReviewResult review={undefined} isLoading={false} error={undefined} />);
    expect(screen.getByText(/run the check/i)).toBeInTheDocument();
  });

  it("shows an error message", () => {
    render(
      <CvReviewResult review={undefined} isLoading={false} error={new Error("provider down")} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("provider down");
  });

  it("renders score, summary, issues, and strengths", () => {
    render(
      <CvReviewResult
        isLoading={false}
        error={undefined}
        review={{
          atsScore: 72,
          summary: "Strong content with minor formatting issues.",
          issues: [
            { category: "spelling", severity: "minor", problem: "'recieve'", fix: "Use 'receive'" },
          ],
          strengths: ["Quantified impact"],
        }}
      />,
    );
    expect(
      screen.getByRole("img", { name: /ATS-friendliness score: 72 out of 100/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/strong content/i)).toBeInTheDocument();
    expect(screen.getByText("'recieve'")).toBeInTheDocument();
    expect(screen.getByText("Use 'receive'")).toBeInTheDocument();
    expect(screen.getByText("Quantified impact")).toBeInTheDocument();
  });
});
