// SSRF-guarded image fetch for the OpenClaw ingest pipeline. `image_url` is
// attacker-influenceable; a naive server-side fetch could be steered at
// cloud-metadata / loopback / RFC-1918 hosts. This module: (1) allows only
// http/https, (2) DNS-resolves the host and rejects any non-public address,
// (3) refuses redirects, (4) caps download size and wall-clock time.
//
// Known limitation (accepted for the current threat model — single-writer
// OpenClaw on Tailscale, ADR-0003): DNS is resolved for the check, then fetch
// resolves again to connect — a TOCTOU/DNS-rebind gap remains. Closing it
// needs IP-pinning via a custom undici dispatcher; out of scope here.
import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // CONTEXT.md: images are ≤2 MB
const FETCH_TIMEOUT_MS = 15_000;

// Default-deny: only plain public unicast is allowed. ipaddr.js classifies
// every reserved range as something other than "unicast". Unparseable → blocked.
export function isBlockedAddress(ip: string): boolean {
  try {
    return ipaddr.parse(ip).range() !== "unicast";
  } catch {
    return true;
  }
}

async function assertHostAllowed(hostname: string): Promise<void> {
  const addrs = await lookup(hostname, { all: true });
  if (addrs.length === 0) throw new Error(`image host did not resolve: ${hostname}`);
  for (const a of addrs) {
    if (isBlockedAddress(a.address)) {
      throw new Error(
        `image host resolves to a non-public address (${a.address}): ${hostname}`,
      );
    }
  }
}

export async function fetchImageSafely(
  rawUrl: string,
): Promise<{ contentType: string; body: Uint8Array }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`invalid image_url: ${rawUrl}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`image_url must be http(s): ${rawUrl}`);
  }
  await assertHostAllowed(url.hostname);

  let res: Response;
  try {
    res = await fetch(rawUrl, {
      redirect: "error", // no redirect-based SSRF bypass (see header comment)
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (e) {
    throw new Error(
      `image fetch failed for ${rawUrl}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  // Keep "(<status>)" in this message — an existing test asserts /404/.
  if (!res.ok) throw new Error(`image fetch failed (${res.status}) for ${rawUrl}`);

  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES) {
    throw new Error(`image exceeds ${MAX_IMAGE_BYTES} bytes: ${rawUrl}`);
  }
  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!res.body) throw new Error(`image response had no body: ${rawUrl}`);

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error(`image exceeds ${MAX_IMAGE_BYTES} bytes: ${rawUrl}`);
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    body.set(c, offset);
    offset += c.byteLength;
  }
  return { contentType, body };
}
