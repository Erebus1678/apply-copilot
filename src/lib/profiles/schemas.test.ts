import { createProfileSchema } from "./schemas";

describe("createProfileSchema", () => {
  it("rejects an empty name", () => {
    expect(createProfileSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("accepts a valid name", () => {
    expect(createProfileSchema.safeParse({ name: "Dmytro" }).success).toBe(true);
  });

  it("rejects a name over 80 chars", () => {
    expect(createProfileSchema.safeParse({ name: "x".repeat(81) }).success).toBe(false);
  });
});
