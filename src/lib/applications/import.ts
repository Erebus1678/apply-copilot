import { createApplicationSchema, type CreateApplicationInput } from "./schemas";

export type ParsedImport = {
  rows: CreateApplicationInput[];
  errors: string[];
};

// ponytail: hand-rolled RFC-4180-ish CSV reader. Handles quoted fields,
// embedded commas/newlines, and "" escapes — enough for an exported job
// tracker. Swap for a library only if users hit a real edge case.
function splitCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

function parseCsv(text: string): Record<string, string>[] {
  const grid = splitCsvRows(text);
  if (grid.length < 2) return [];
  const header = grid[0].map((h) => h.trim());
  return grid.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => {
      obj[key] = cells[i] ?? "";
    });
    return obj;
  });
}

function parseJsonRecords(text: string): Record<string, unknown>[] {
  const data: unknown = JSON.parse(text);
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { applications?: unknown }).applications)
  ) {
    return (data as { applications: Record<string, unknown>[] }).applications;
  }
  throw new Error("JSON must be an array of applications");
}

// Map a raw record (string-valued for CSV, mixed for JSON) to a candidate the
// schema can validate. Field names are matched case-insensitively.
function coerceRow(raw: Record<string, unknown>): unknown {
  const lookup: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    lookup[key.toLowerCase()] = typeof value === "string" ? value.trim() : value;
  }
  const get = (key: string) => lookup[key.toLowerCase()];

  const candidate: Record<string, unknown> = {
    company: get("company"),
    role: get("role"),
  };

  const status = get("status");
  if (typeof status === "string" && status !== "") candidate.status = status.toLowerCase();

  const fit = get("fitScore") ?? get("fit_score") ?? get("fit");
  if (fit !== undefined && fit !== null && fit !== "") candidate.fitScore = Number(fit);

  const jobUrl = get("jobUrl") ?? get("job_url") ?? get("url");
  if (typeof jobUrl === "string" && jobUrl !== "") candidate.jobUrl = jobUrl;

  const notes = get("notes");
  if (typeof notes === "string" && notes !== "") candidate.notes = notes;

  return candidate;
}

/**
 * Parse a CSV or JSON export into validated application rows. Detection is by
 * extension first, then by content shape. Invalid rows are skipped and reported
 * (one message each) rather than failing the whole import.
 */
export function parseImportFile(text: string, filename: string): ParsedImport {
  const trimmed = text.trim();
  const isJson =
    filename.toLowerCase().endsWith(".json") || trimmed.startsWith("[") || trimmed.startsWith("{");

  let records: Record<string, unknown>[];
  try {
    records = isJson ? parseJsonRecords(text) : parseCsv(text);
  } catch (e) {
    return { rows: [], errors: [e instanceof Error ? e.message : "Could not parse file"] };
  }

  const rows: CreateApplicationInput[] = [];
  const errors: string[] = [];
  records.forEach((raw, i) => {
    const parsed = createApplicationSchema.safeParse(coerceRow(raw));
    if (parsed.success) {
      rows.push(parsed.data);
    } else {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join(".") || "row";
      errors.push(`Row ${i + 1}: ${field} — ${issue?.message ?? "invalid"}`);
    }
  });

  return { rows, errors };
}
