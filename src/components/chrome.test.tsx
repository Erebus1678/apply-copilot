import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({ usePathname: () => "/analyze" }));

import { SiteNav } from "./site-nav";
import { SiteFooter } from "./site-footer";
import { PageHeading } from "./page-heading";

describe("SiteNav", () => {
  beforeEach(() => localStorage.clear());

  it("renders the brand and marks the current route active", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: /apply copilot/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Analyze" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Cover letter" })).not.toHaveAttribute("aria-current");
  });
});

describe("SiteFooter", () => {
  it("renders the product line", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/private by default/i)).toBeInTheDocument();
  });
});

describe("PageHeading", () => {
  it("renders eyebrow, title, and description", () => {
    render(
      <PageHeading eyebrow="01 · Analyze" title="Analyze a job description">
        A short description.
      </PageHeading>,
    );
    expect(screen.getByRole("heading", { name: /analyze a job description/i })).toBeInTheDocument();
    expect(screen.getByText("01 · Analyze")).toBeInTheDocument();
    expect(screen.getByText("A short description.")).toBeInTheDocument();
  });
});
