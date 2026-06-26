import { createProfile, fetchProfiles } from "./client";

describe("profiles client", () => {
  afterEach(() => {
    // @ts-expect-error reset injected mock
    delete global.fetch;
  });

  it("fetches the profile list", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: "p1", name: "Personal" }] }),
    });
    const list = await fetchProfiles();
    expect(list).toEqual([{ id: "p1", name: "Personal" }]);
  });

  it("creates a profile and returns it", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "p2", name: "Anna" } }),
    });
    await expect(createProfile({ name: "Anna" })).resolves.toEqual({ id: "p2", name: "Anna" });
  });

  it("throws the server error on failure", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Name is required" }),
    });
    await expect(createProfile({ name: "" })).rejects.toThrow("Name is required");
  });
});
