import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Application } from "@/db/schema";

jest.mock("@/lib/applications/client", () => ({
  fetchApplications: jest.fn(),
  createApplication: jest.fn(),
  importApplications: jest.fn(),
  patchApplication: jest.fn(),
  deleteApplication: jest.fn(),
}));

import { BoardView } from "./BoardView";
import * as client from "@/lib/applications/client";
import { setActiveProfile } from "@/features/profile/useProfileStore";

const mocked = client as jest.Mocked<typeof client>;

// jsdom's File.text() is unreliable; stub it so the test exercises the handler,
// not the Blob streaming internals (File.text is standard in real browsers).
function fileWithText(content: string, name: string): File {
  const file = new File([content], name, { type: "application/json" });
  Object.defineProperty(file, "text", { value: () => Promise.resolve(content) });
  return file;
}

function makeApp(over: Partial<Application>): Application {
  return {
    id: "id-1",
    profileId: null,
    company: "Acme",
    role: "Engineer",
    status: "saved",
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

describe("BoardView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setActiveProfile("p1");
    mocked.fetchApplications.mockResolvedValue([]);
  });

  it("prompts to pick a profile when none is active", () => {
    setActiveProfile("");
    render(<BoardView />);
    expect(screen.getByText(/select your profile/i)).toBeInTheDocument();
    expect(mocked.fetchApplications).not.toHaveBeenCalled();
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

  it("imports applications from a selected file", async () => {
    mocked.importApplications.mockResolvedValue([
      makeApp({ id: "imp1", company: "Imported Co", role: "Backend Engineer" }),
    ]);
    render(<BoardView />);
    await waitFor(() => expect(mocked.fetchApplications).toHaveBeenCalled());

    const file = fileWithText(
      JSON.stringify([{ company: "Imported Co", role: "Backend Engineer" }]),
      "jobs.json",
    );
    const input = screen.getByLabelText(/import applications/i);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(mocked.importApplications).toHaveBeenCalled());
    expect(await screen.findByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Imported 1");
  });

  it("shows an error when the file has no valid rows", async () => {
    render(<BoardView />);
    await waitFor(() => expect(mocked.fetchApplications).toHaveBeenCalled());

    const file = fileWithText("{ broken json", "bad.json");
    const input = screen.getByLabelText(/import applications/i);
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(mocked.importApplications).not.toHaveBeenCalled();
  });

  it("surfaces a load error", async () => {
    mocked.fetchApplications.mockRejectedValue(new Error("db down"));
    render(<BoardView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("db down");
  });

  it("rolls back an optimistic status change when the API fails", async () => {
    mocked.fetchApplications.mockResolvedValue([
      makeApp({ id: "a1", role: "Frontend Engineer", status: "saved" }),
    ]);
    mocked.patchApplication.mockRejectedValue(new Error("nope"));
    render(<BoardView />);
    const select = await screen.findByLabelText(/status for frontend engineer/i);
    fireEvent.change(select, { target: { value: "interview" } });
    await screen.findByRole("alert");
    expect(await screen.findByLabelText(/status for frontend engineer/i)).toHaveValue("saved");
  });
});
