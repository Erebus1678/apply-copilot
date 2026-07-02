import { envInt } from "./env";

describe("envInt", () => {
  const KEY = "TEST_ENV_INT";
  afterEach(() => {
    delete process.env[KEY];
  });

  it("returns the default when unset", () => {
    expect(envInt(KEY, 20)).toBe(20);
  });

  it("returns the default for empty / whitespace", () => {
    process.env[KEY] = "   ";
    expect(envInt(KEY, 20)).toBe(20);
  });

  it("parses a valid positive integer", () => {
    process.env[KEY] = "50";
    expect(envInt(KEY, 20)).toBe(50);
  });

  it("rejects non-integers and falls back", () => {
    process.env[KEY] = "abc";
    expect(envInt(KEY, 20)).toBe(20);
    process.env[KEY] = "3.5";
    expect(envInt(KEY, 20)).toBe(20);
  });

  it("rejects values below the floor", () => {
    process.env[KEY] = "0";
    expect(envInt(KEY, 20, 1)).toBe(20);
    process.env[KEY] = "500";
    expect(envInt(KEY, 5000, 1000)).toBe(5000);
  });
});
