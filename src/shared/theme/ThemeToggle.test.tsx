import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("toggles to dark and persists the choice", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /switch to dark theme/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("apply-copilot:theme")).toBe("dark");
  });

  it("toggles back to light", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /switch to dark theme/i }));
    fireEvent.click(screen.getByRole("button", { name: /switch to light theme/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("apply-copilot:theme")).toBe("light");
  });
});
