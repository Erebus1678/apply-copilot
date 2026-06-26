import { render, screen, fireEvent } from "@testing-library/react";
import { ApplicationCard } from "./ApplicationCard";
import type { Application } from "@/db/schema";

const app: Application = {
  id: "a1",
  profileId: null,
  company: "Acme",
  role: "Senior Frontend Engineer",
  status: "applied",
  fitScore: 82,
  jobUrl: "https://jobs.acme.com/1",
  notes: "Strong match",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ApplicationCard", () => {
  it("renders role, company, and the fit badge", () => {
    render(<ApplicationCard app={app} onStatusChange={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Senior Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText(/Fit 82/)).toBeInTheDocument();
  });

  it("fires status change and delete with the application id", () => {
    const onStatusChange = jest.fn();
    const onDelete = jest.fn();
    render(<ApplicationCard app={app} onStatusChange={onStatusChange} onDelete={onDelete} />);

    fireEvent.change(screen.getByLabelText(/status for senior frontend engineer/i), {
      target: { value: "offer" },
    });
    expect(onStatusChange).toHaveBeenCalledWith("a1", "offer");

    fireEvent.click(screen.getByRole("button", { name: /delete senior frontend engineer/i }));
    expect(onDelete).toHaveBeenCalledWith("a1");
  });
});
