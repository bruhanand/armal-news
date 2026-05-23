// Mobile deep-dive shows an accent "View source ↗" pill PLUS a mono host line
// below it (per ADR 0004 § L). The host line format mirrors the web SSR
// helper at apps/web/src/app/story/[slug]/page.tsx — host + path-segments
// joined by " / ", with leading `www.` stripped. Returns null when the URL
// can't be parsed so the caller can hide the line entirely.

export function parseSourceHost(sourceLink: string): string | null {
  try {
    const url = new URL(sourceLink);
    const host = url.host.replace(/^www\./, "");
    const segments = url.pathname.split("/").filter(Boolean);
    return [host, ...segments].join(" / ");
  } catch {
    return null;
  }
}
