// Optional external compression hook (Headroom-style). When COMPRESS_PROXY_URL
// is set, prompt text is routed through that /v1/compress proxy before it reaches
// the provider; clients are unchanged. OFF by default, and ANY failure falls back
// to the original text so a flaky/slow proxy can never break a request.
//
// Contract: POST { text } -> { text }. Optional bearer via COMPRESS_PROXY_TOKEN.
// ponytail: this is real egress — the prompt leaves the box to the proxy. It's
// opt-in and self-host-configured; document it as such.

const TIMEOUT_MS = 4000;

function proxyUrl(): string | undefined {
  const value = process.env.COMPRESS_PROXY_URL;
  return value && value.trim() ? value.trim() : undefined;
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
