import { act, renderHook, waitFor } from "@testing-library/react";

const store = new Map<string, unknown>();
jest.mock("idb-keyval", () => ({
  get: jest.fn(async (k: string) => store.get(k)),
  set: jest.fn(async (k: string, v: unknown) => void store.set(k, v)),
  del: jest.fn(async (k: string) => void store.delete(k)),
}));

let activeProfile = "";
jest.mock("@/shared/profile/useProfileStore", () => ({
  useActiveProfile: () => activeProfile,
}));

import { useCurrentCv } from "./cvStore";

describe("useCurrentCv", () => {
  beforeEach(() => store.clear());

  it("stores pasted text as a text CV", async () => {
    activeProfile = "p-text";
    const { result } = renderHook(() => useCurrentCv());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setText("hello cv"));
    expect(result.current.cv).toMatchObject({ kind: "text", text: "hello cv", file: null });
  });

  it("stores an upload as a file CV keeping text + layout", async () => {
    activeProfile = "p-file";
    const { result } = renderHook(() => useCurrentCv());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const file = new File(["x"], "cv.pdf", { type: "application/pdf" });
    act(() => result.current.setUpload(file, "extracted", null));
    expect(result.current.cv).toMatchObject({ kind: "file", text: "extracted", file });
  });

  it("clears the CV", async () => {
    activeProfile = "p-clear";
    const { result } = renderHook(() => useCurrentCv());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setText("temp"));
    act(() => result.current.clear());
    expect(result.current.cv).toBeNull();
  });

  it("hydrates a previously stored CV for the profile", async () => {
    store.set("cv:p-restore", { kind: "text", text: "saved earlier", layout: null, file: null });
    activeProfile = "p-restore";
    const { result } = renderHook(() => useCurrentCv());

    await waitFor(() => expect(result.current.cv).toMatchObject({ text: "saved earlier" }));
  });
});
