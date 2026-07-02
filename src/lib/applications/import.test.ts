import { parseImportFile, summarizeSkipped } from "./import";

describe("summarizeSkipped", () => {
  it("returns an empty string when nothing was skipped", () => {
    expect(summarizeSkipped([])).toBe("");
  });

  it("joins up to max messages", () => {
    expect(summarizeSkipped(["Row 1: a — x", "Row 2: b — y"])).toBe("Row 1: a — x; Row 2: b — y");
  });

  it("appends a +N more tail past the cap", () => {
    const errors = ["e1", "e2", "e3", "e4", "e5"];
    expect(summarizeSkipped(errors, 3)).toBe("e1; e2; e3 (+2 more)");
  });
});

describe("parseImportFile", () => {
  it("parses a JSON array of applications", () => {
    const text = JSON.stringify([
      { company: "Acme", role: "Frontend Engineer", status: "applied", fitScore: 82 },
      { company: "Globex", role: "Staff Engineer" },
    ]);
    const { rows, errors } = parseImportFile(text, "export.json");
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ company: "Acme", status: "applied", fitScore: 82 });
    expect(rows[1].status).toBe("saved"); // schema default
  });

  it("accepts a JSON object with an applications array", () => {
    const text = JSON.stringify({ applications: [{ company: "Acme", role: "Engineer" }] });
    const { rows } = parseImportFile(text, "backup.json");
    expect(rows).toHaveLength(1);
  });

  it("parses CSV and coerces numeric and enum columns", () => {
    const csv = ["company,role,status,fitScore", "Acme,Frontend Engineer,interview,90"].join("\n");
    const { rows, errors } = parseImportFile(csv, "jobs.csv");
    expect(errors).toHaveLength(0);
    expect(rows[0]).toMatchObject({
      company: "Acme",
      role: "Frontend Engineer",
      status: "interview",
      fitScore: 90,
    });
  });

  it("handles quoted CSV fields with commas and embedded quotes", () => {
    const csv = [
      "company,role,notes",
      '"Acme, Inc.","Engineer","Said ""hello, world"" in the call"',
    ].join("\n");
    const { rows } = parseImportFile(csv, "jobs.csv");
    expect(rows[0].company).toBe("Acme, Inc.");
    expect(rows[0].notes).toBe('Said "hello, world" in the call');
  });

  it("skips invalid rows and reports them without failing the whole import", () => {
    const text = JSON.stringify([
      { company: "Acme", role: "Engineer" },
      { company: "", role: "Missing company" },
      { company: "Globex", role: "Engineer", jobUrl: "not-a-url" },
    ]);
    const { rows, errors } = parseImportFile(text, "x.json");
    expect(rows).toHaveLength(1);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/Row 2/);
  });

  it("returns a single error for malformed JSON", () => {
    const { rows, errors } = parseImportFile("{ not json", "broken.json");
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it("returns nothing for a header-only CSV", () => {
    const { rows, errors } = parseImportFile("company,role\n", "empty.csv");
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });
});
