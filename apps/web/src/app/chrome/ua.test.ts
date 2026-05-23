import { describe, expect, it } from "vitest";
import { detectMobilePlatform } from "./ua";

describe("detectMobilePlatform", () => {
  it("returns null for desktop UAs", () => {
    expect(
      detectMobilePlatform(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      ),
    ).toBeNull();
    expect(
      detectMobilePlatform(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ),
    ).toBeNull();
  });

  it("detects iPhone Safari as ios", () => {
    expect(
      detectMobilePlatform(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      ),
    ).toBe("ios");
  });

  it("detects Android Chrome as android", () => {
    expect(
      detectMobilePlatform(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      ),
    ).toBe("android");
  });

  it("returns null for iPad (Safari Add-to-Home owns this surface)", () => {
    // iPadOS reports as Macintosh in modern UAs — explicitly verifying our
    // sniff doesn't fire on it.
    expect(
      detectMobilePlatform(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      ),
    ).toBeNull();
  });

  it("returns null for empty / missing input", () => {
    expect(detectMobilePlatform(null)).toBeNull();
    expect(detectMobilePlatform(undefined)).toBeNull();
    expect(detectMobilePlatform("")).toBeNull();
  });
});
