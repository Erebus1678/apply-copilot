import { createApplicationSchema, updateApplicationSchema } from "./schemas";

describe("createApplicationSchema", () => {
  it("requires a company and a role", () => {
    expect(createApplicationSchema.safeParse({ company: "", role: "Dev" }).success).toBe(false);
    expect(createApplicationSchema.safeParse({ company: "Acme", role: "" }).success).toBe(false);
  });

  it("defaults the status to saved", () => {
    const parsed = createApplicationSchema.parse({ company: "Acme", role: "Engineer" });
    expect(parsed.status).toBe("saved");
  });

  it("rejects a javascript: job URL but accepts https", () => {
    const base = { company: "Acme", role: "Engineer" };
    expect(
      createApplicationSchema.safeParse({ ...base, jobUrl: "javascript:alert(1)" }).success,
    ).toBe(false);
    expect(
      createApplicationSchema.safeParse({ ...base, jobUrl: "https://jobs.acme.com/1" }).success,
    ).toBe(true);
  });

  it("bounds the fit score to 0-100", () => {
    const base = { company: "Acme", role: "Engineer" };
    expect(createApplicationSchema.safeParse({ ...base, fitScore: 120 }).success).toBe(false);
    expect(createApplicationSchema.safeParse({ ...base, fitScore: 80 }).success).toBe(true);
  });
});

describe("updateApplicationSchema", () => {
  it("rejects an empty patch", () => {
    expect(updateApplicationSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an unknown status", () => {
    expect(updateApplicationSchema.safeParse({ status: "ghosted" }).success).toBe(false);
  });

  it("accepts a single-field status change", () => {
    expect(updateApplicationSchema.safeParse({ status: "interview" }).success).toBe(true);
  });
});
