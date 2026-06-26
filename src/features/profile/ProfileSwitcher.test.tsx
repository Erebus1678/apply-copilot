import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("@/lib/profiles/client", () => ({ fetchProfiles: jest.fn(), createProfile: jest.fn() }));

import { createProfile, fetchProfiles } from "@/lib/profiles/client";
import { ProfileSwitcher } from "./ProfileSwitcher";

const mockFetch = fetchProfiles as jest.Mock;
const mockCreate = createProfile as jest.Mock;

function profile(id: string, name: string) {
  return { id, name, createdAt: new Date() };
}

describe("ProfileSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
    mockFetch.mockReset();
    mockCreate.mockReset();
  });

  it("loads profiles and selects the first as active", async () => {
    mockFetch.mockResolvedValue([profile("p1", "Personal")]);
    render(<ProfileSwitcher />);
    expect(await screen.findByRole("button", { name: /personal/i })).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem("apply-copilot:profile")).toBe("p1"));
  });

  it("switches the active profile", async () => {
    mockFetch.mockResolvedValue([profile("p1", "Personal"), profile("p2", "Anna")]);
    render(<ProfileSwitcher />);
    fireEvent.click(await screen.findByRole("button", { name: /personal/i }));
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
