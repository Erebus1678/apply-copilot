import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { assertPublicUrl } from "./url-guard";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 4 * 1024 * 1024; // don't parse pathologically large pages
const MAX_TEXT_CHARS = 20_000; // matches the jd cap in analyze/cover-letter schemas

// A real desktop UA — many job boards return a stub or 403 to unknown agents.
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

/** Fetch a job posting URL and return its main text, or throw a user-facing error. */
export async function extractJdFromUrl(rawUrl: string): Promise<string> {
  const url = assertPublicUrl(rawUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
    });
  } catch {
    throw new Error("Couldn't reach that URL.");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new Error(`The page returned HTTP ${res.status}.`);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("html") && !contentType.includes("text")) {
    throw new Error("That link isn't an HTML page — upload the file instead.");
  }

  const html = (await res.text()).slice(0, MAX_HTML_BYTES);
  const { document } = parseHTML(html);
  const article = new Readability(document).parse();
  const text = normalize(article?.textContent ?? document.body?.textContent ?? "");
  if (text.length < 20) {
    throw new Error("Couldn't extract the job text — paste it or upload a screenshot.");
  }
  return text;
}
