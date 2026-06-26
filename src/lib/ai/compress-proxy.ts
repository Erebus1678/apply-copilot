// Optional external compression hook (Headroom-style). When COMPRESS_PROXY_URL
// is set, prompt text is routed through that /v1/compress proxy before it reaches
// the provider; clients are unchanged. OFF by default, and ANY failure falls back
// to the original text so a flaky/slow proxy can never break a request.
//
// Contract: POST { text } -> { text }. Optional bearer via COMPRESS_PROXY_TOKEN.
// This is real egress — the prompt (JD/CV text) leaves the box to the proxy. It's
// opt-in and self-host-configured, and only http(s) URLs are honoured so a stray
// scheme (file:, gopher:, …) can't be used to exfiltrate or probe.

const TIMEOUT_MS = 4000;

function proxyUrl(): string | undefined {
  const value = process.env.COMPRESS_PROXY_URL?.trim();
  if (!value) return undefined;
  try {
    const { protocol } = new URL(value);
    if (protocol !== "http:" && protocol !== "https:") return undefined;
  } catch {
    return undefined; // not a valid absolute URL → ignore
  }
  return value;
}

export async function maybeCompressViaProxy(text: string): Promise<string> {
  const url = proxyUrl();
  if (!url) return text;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const token = process.env.COMPRESS_PROXY_TOKEN?.trim();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    if (!res.ok) return text;
    const data = (await res.json()) as { text?: unknown };
    return typeof data.text === "string" && data.text.trim() ? data.text : text;
  } catch {
    return text; // proxy down / timeout / bad response → original text
  } finally {
    clearTimeout(timer);
  }
}
