import { describe, expect, it } from "vitest";
import { isBlockedAddress } from "./safe-image-fetch";

describe("isBlockedAddress", () => {
  it.each([
    "127.0.0.1", // loopback
    "169.254.169.254", // link-local (cloud metadata)
    "10.0.0.5", // RFC-1918 private
    "172.16.0.1", // RFC-1918 private
    "192.168.1.1", // RFC-1918 private
    "100.64.0.1", // carrier-grade NAT (Tailscale 100.64/10)
    "::1", // IPv6 loopback
    "garbage", // unparseable
  ])("blocks the non-public address %s", (ip) => {
    expect(isBlockedAddress(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "93.184.216.34"])(
    "allows the public unicast address %s",
    (ip) => {
      expect(isBlockedAddress(ip)).toBe(false);
    },
  );
});
