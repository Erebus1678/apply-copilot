const dbReady = { current: Promise.resolve() as Promise<unknown> };
jest.mock("@/db/client", () => ({
  get dbReady() {
    return dbReady.current;
  },
  dbInfo: { driver: "pglite", path: "/data/pgdata" },
}));

import { logStartup } from "./startup";

describe("logStartup", () => {
  const env = process.env.AI_PROVIDER;
  let warn: jest.SpyInstance;
  let info: jest.SpyInstance;
  let error: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    info = jest.spyOn(console, "info").mockImplementation(() => {});
    error = jest.spyOn(console, "error").mockImplementation(() => {});
    dbReady.current = Promise.resolve();
  });
  afterEach(() => {
    jest.restoreAllMocks();
    if (env === undefined) delete process.env.AI_PROVIDER;
    else process.env.AI_PROVIDER = env;
    delete process.env.OPENAI_API_KEY;
  });

  it("warns when AI_PROVIDER is set to an unknown value", async () => {
    process.env.AI_PROVIDER = "opemai"; // typo
    await logStartup();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("opemai"));
  });

  it("does not warn for a valid provider", async () => {
    process.env.AI_PROVIDER = "openai";
    await logStartup();
    expect(warn).not.toHaveBeenCalled();
  });

  it("logs key presence only, never the key value", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-super-secret-value";
    await logStartup();
    const logged = info.mock.calls.flat().join(" ");
    expect(logged).toContain("key=set");
    expect(logged).not.toContain("sk-super-secret-value");
  });

  it("logs a failed boot migration instead of throwing", async () => {
    dbReady.current = Promise.reject(new Error("migration boom"));
    await expect(logStartup()).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("migration failed"),
      expect.any(Error),
    );
  });
});
