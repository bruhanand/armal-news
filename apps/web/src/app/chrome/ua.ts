export type MobilePlatform = "ios" | "android";

// Plain-string sniff is enough for the only choice we make here: "should we
// show the store banner instead of the PWA prompt." iPadOS UAs intentionally
// fall through to desktop — install on iPad goes through Safari's Add-to-Home
// affordance, which we don't redirect away from.
export function detectMobilePlatform(
  userAgent: string | null | undefined,
): MobilePlatform | null {
  if (!userAgent) return null;
  if (/Android/i.test(userAgent)) return "android";
  if (/iPhone|iPod/.test(userAgent)) return "ios";
  return null;
}
