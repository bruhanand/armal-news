// Accept only http(s) URLs. Callers fetch or render these values, so a
// javascript:/data: scheme would be an SSRF or stored-XSS sink.
export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
