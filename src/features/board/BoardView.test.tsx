import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Application } from "@/db/schema";

jest.mock("@/lib/applications/client", () => ({
  fetchApplications: jest.fn(),
  createApplication: jest.fn(),
  patchApplication: jest.fn(),
  deleteApplication: jest.fn(),
}));

import { BoardView } from "./BoardView";
import * as client from "@/lib/applications/client";

const mocked = client as jest.Mocked<typeof client>;

function makeApp(over: Partial<Application>): Application {
  return {
    id: "id-1",
    company: "Acme",
    role: "Engineer",
    status: "saved",
    fitScore: null,
    jobUrl: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

describe("BoardView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.fetchApplications.mockResolvedValue([]);
  });

  it("renders applications returned from the API", async () => {
    mocked.fetchApplications.mockResolvedValue([
      makeApp({ id: "a1", company: "Acme", role: "Frontend Engineer", status: "applied" }),
    ]);
    render(<BoardView />);
    expect(await screen.findByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });

  it("creates an application from the add form", async () => {
    mocked.createApplication.mockResolvedValue(
      makeApp({ id: "new", company: "Globex", role: "Staff Engineer" }),
    );
    render(<BoardView />);
    await waitFor(() => expect(mocked.fetchApplications).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/company/i), { target: { value: "Globex" } });
    fireEvent.change(screen.getByLabelText(/^role$/i), { target: { value: "Staff Engineer" } });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() =>
      expect(mocked.createApplication).toHaveBeenCalledWith(
        expect.objectContaining({ company: "Globex", role: "Staff Engineer" }),
      ),
    );
    expect(await screen.findByText("Staff Engineer")).toBeInTheDocument();
  });

  it("patches status on change", async () => {
    mocked.fetchApplications.mockResolvedValue([
      makeApp({ id: "a1", role: "Frontend Engineer", status: "saved" }),
    ]);
    mocked.patchApplication.mockResolvedValue(makeApp({ id: "a1", status: "interview" }));
    render(<BoardView />);
    const select = await screen.findByLabelText(/status for frontend engineer/i);
    fireEvent.change(select, { target: { value: "interview" } });
    await waitFor(() =>
      expect(mocked.patchApplication).toHaveBeenCalledWith("a1", { status: "interview" }),
    );
  });

  it("deletes an application optimistically", async () => {
    mocked.fetchApplications.mockResolvedValue([makeApp({ id: "a1", role: "Frontend Engineer" })]);
    mocked.deleteApplication.mockResolvedValue();
    render(<BoardView />);
    const del = await screen.findByRole("button", { name: /delete frontend engineer/i });
    fireEvent.click(del);
    await waitFor(() => expect(mocked.deleteApplication).toHaveBeenCalledWith("a1"));
    expect(screen.queryByText("Frontend Engineer")).not.toBeInTheDocument();
  });
});
