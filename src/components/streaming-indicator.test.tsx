import { render, screen } from "@testing-library/react";
import { StreamingIndicator } from "./streaming-indicator";

describe("StreamingIndicator", () => {
  it("renders the default label as a status", () => {
    render(<StreamingIndicator />);
    expect(screen.getByRole("status")).toHaveTextContent("Streaming…");
  });

  it("renders a custom label", () => {
    render(<StreamingIndicator label="Analyzing…" />);
    expect(screen.getByRole("status")).toHaveTextContent("Analyzing…");
  });
});
