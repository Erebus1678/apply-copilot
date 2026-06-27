// SSRF guard for the "fetch a job link" feature. Pure (no DOM/network deps) so it
// stays cheap to unit-test. The route fetches whatever URL the user pastes, so we
// must reject links that point back into the host's own network.

function isPrivateIpv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true; // link-local, incl. 169.254.169.254 cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/**
 * Validate a user-supplied URL is a public http(s) address, or throw.
 * ponytail: blocks loopback/private hosts + IPv4 literals; no DNS resolution or
 * post-redirect re-check — adequate for a single-user local tool, harden for SaaS.
 */
export function assertPublicUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) links are supported.");
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const isIpv6 = host.includes(":");
  const blocked =
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    (isIpv6 && (host === "::1" || host.startsWith("fe80:") || /^f[cd]/.test(host))) ||
    isPrivateIpv4(host);
  if (blocked) {
    throw new Error("That URL points to a private address.");
  }
  return url;
}
