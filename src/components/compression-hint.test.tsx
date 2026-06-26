import { render, screen } from "@testing-library/react";
import { CompressionHint } from "./compression-hint";

describe("CompressionHint", () => {
  it("renders nothing for short input", () => {
    const { container } = render(<CompressionHint sources={["too short"]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the estimated saving for padded input", () => {
    const padded = "word     ".repeat(60) + "\n\n\n\n" + "line\nline\nline\n";
    render(<CompressionHint sources={[padded]} />);
    expect(screen.getByRole("status")).toHaveTextContent(/%\s*input tokens trimmed/i);
  });
});
