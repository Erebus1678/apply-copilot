import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders the product headline", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: /copilot for landing your next role/i }),
    ).toBeInTheDocument();
  });

  it("lists the four core capabilities", () => {
    render(<Home />);
    for (const label of ["Analyze", "Score", "Draft", "Track"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
