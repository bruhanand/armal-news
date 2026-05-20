import { describe, expect, it } from "vitest";
import { isHttpUrl } from "./url";

describe("isHttpUrl", () => {
  it.each(["http://example.com", "https://example.com/path?q=1"])(
    "accepts the http(s) URL %s",
    (url) => {
      expect(isHttpUrl(url)).toBe(true);
    },
  );

  it.each([
    "javascript:alert(1)",
    "data:text/html,x",
    "ftp://example.com",
    "not-a-url",
    "",
  ])("rejects the non-http(s) value %s", (value) => {
    expect(isHttpUrl(value)).toBe(false);
  });
});
