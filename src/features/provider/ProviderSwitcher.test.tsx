import { render, screen, fireEvent } from "@testing-library/react";
import { ProviderSwitcher } from "./ProviderSwitcher";

describe("ProviderSwitcher", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to the Local provider", () => {
    render(<ProviderSwitcher />);
    expect(screen.getByRole("button", { name: "Local" })).toHaveAttribute("aria-pressed", "true");
  });

  it("selects a provider and persists the choice", () => {
    render(<ProviderSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: "OpenAI" }));
    expect(screen.getByRole("button", { name: "OpenAI" })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("apply-copilot:provider")).toBe("openai");
  });
});
