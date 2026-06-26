import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("@/lib/profiles/client", () => ({
  fetchProfiles: jest.fn(),
  createProfile: jest.fn(),
  renameProfile: jest.fn(),
}));

import { createProfile, fetchProfiles, renameProfile } from "@/lib/profiles/client";
import { ProfileSwitcher } from "./ProfileSwitcher";

const mockFetch = fetchProfiles as jest.Mock;
const mockCreate = createProfile as jest.Mock;
const mockRename = renameProfile as jest.Mock;

function profile(id: string, name: string) {
  return { id, name, createdAt: new Date() };
}

describe("ProfileSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetch.mockReset();
    mockCreate.mockReset();
    mockRename.mockReset();
  });

  it("renames a profile inline", async () => {
    mockFetch.mockResolvedValue([profile("p1", "Personal")]);
    mockRename.mockResolvedValue(profile("p1", "Dima"));
    render(<ProfileSwitcher />);
    fireEvent.click(await screen.findByRole("button", { name: "Personal" }));
    fireEvent.click(screen.getByRole("button", { name: "Rename Personal" }));
    fireEvent.change(screen.getByLabelText("Rename Personal"), { target: { value: "Dima" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mockRename).toHaveBeenCalledWith("p1", "Dima"));
    expect(await screen.findByRole("button", { name: "Dima" })).toBeInTheDocument();
  });

  it("loads profiles and selects the first as active", async () => {
    mockFetch.mockResolvedValue([profile("p1", "Personal")]);
    render(<ProfileSwitcher />);
    expect(await screen.findByRole("button", { name: /personal/i })).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem("apply-copilot:profile")).toBe("p1"));
  });

  it("does not auto-select when several profiles exist (requires a choice)", async () => {
    mockFetch.mockResolvedValue([profile("p1", "Personal"), profile("p2", "Anna")]);
    render(<ProfileSwitcher />);
    // Button shows the neutral placeholder, and nothing is stored automatically —
    // so a shared device doesn't land on someone else's profile.
    expect(await screen.findByRole("button", { name: /profile/i })).toBeInTheDocument();
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(localStorage.getItem("apply-copilot:profile")).toBeNull();
  });

  it("switches the active profile", async () => {
    mockFetch.mockResolvedValue([profile("p1", "Personal"), profile("p2", "Anna")]);
    render(<ProfileSwitcher />);
    fireEvent.click(await screen.findByRole("button", { name: /profile/i }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Anna" }));
    await waitFor(() => expect(localStorage.getItem("apply-copilot:profile")).toBe("p2"));
  });

  it("creates a new profile and makes it active", async () => {
    mockFetch.mockResolvedValue([profile("p1", "Personal")]);
    mockCreate.mockResolvedValue(profile("p3", "Work"));
    render(<ProfileSwitcher />);
    fireEvent.click(await screen.findByRole("button", { name: /personal/i }));
    fireEvent.change(screen.getByLabelText(/new profile name/i), { target: { value: "Work" } });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith({ name: "Work" }));
    await waitFor(() => expect(localStorage.getItem("apply-copilot:profile")).toBe("p3"));
  });
});
