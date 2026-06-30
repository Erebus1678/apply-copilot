import { render, screen } from "@testing-library/react";
import type { Application } from "@/db/schema";

jest.mock("@/lib/applications/client", () => ({ fetchApplications: jest.fn() }));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { fetchApplications } from "@/lib/applications/client";
import { setActiveProfile } from "@/features/profile/useProfileStore";
import { StatsView } from "./StatsView";

const mockFetch = fetchApplications as jest.Mock;

function app(over: Partial<Application>): Application {
  return {
    id: Math.random().toString(),
    profileId: null,
    company: "Acme",
    role: "Engineer",
    status: "applied",
    fitScore: null,
    salary: null,
    grade: null,
    jobUrl: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

describe("StatsView", () => {
  beforeEach(() => {
    localStorage.clear();
    setActiveProfile("p1");
    mockFetch.mockReset();
  });

  it("prompts to pick a profile when none is active", () => {
    setActiveProfile("");
    render(<StatsView />);
    expect(screen.getByText(/select your profile/i)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("shows the empty state when there are no applications", async () => {
    mockFetch.mockResolvedValue([]);
    render(<StatsView />);
    expect(await screen.findByText(/no applications yet/i)).toBeInTheDocument();
  });

  it("shows an error when loading fails", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));
    render(<StatsView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("network down");
  });

  it("renders headline cards and the pipeline breakdown", async () => {
    mockFetch.mockResolvedValue([
      app({ status: "applied", fitScore: 80 }),
      app({ status: "offer", fitScore: 100 }),
    ]);
    render(<StatsView />);
    expect(await screen.findByText("Pipeline")).toBeInTheDocument();
    // Offer rate = 1 offer / 2 submitted = 50%
    expect(screen.getByText("50%")).toBeInTheDocument();
    // Avg fit = 90
    expect(screen.getByText("90")).toBeInTheDocument();
  });
});
