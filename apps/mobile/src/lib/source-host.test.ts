import { describe, expect, it } from "vitest";
import { parseSourceHost } from "./source-host";

describe("parseSourceHost", () => {
  it("joins host + path segments with ' / '", () => {
    expect(parseSourceHost("https://anthropic.com/research/circuits-2026")).toBe(
      "anthropic.com / research / circuits-2026",
    );
  });

  it("strips leading www.", () => {
    expect(parseSourceHost("https://www.example.com/foo")).toBe(
      "example.com / foo",
    );
  });

  it("returns host-only for root paths", () => {
    expect(parseSourceHost("https://example.com")).toBe("example.com");
    expect(parseSourceHost("https://example.com/")).toBe("example.com");
  });

  it("returns null for malformed URLs", () => {
    expect(parseSourceHost("not-a-url")).toBeNull();
    expect(parseSourceHost("")).toBeNull();
  });
});
