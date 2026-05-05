import { describe, expect, it } from "vitest";
import { matchFeedShortcut } from "./shortcuts";

function ev(init: Partial<KeyboardEvent>): KeyboardEvent {
  // Tests run under happy-dom-less Node; KeyboardEvent isn't constructable
  // here, but matchFeedShortcut only reads a fixed surface — pass a stub.
  return init as unknown as KeyboardEvent;
}

describe("matchFeedShortcut", () => {
  it("maps J / ArrowDown to 'next'", () => {
    expect(matchFeedShortcut(ev({ code: "KeyJ", key: "j" }))).toBe("next");
    expect(matchFeedShortcut(ev({ key: "ArrowDown" }))).toBe("next");
  });

  it("maps K / ArrowUp to 'prev'", () => {
    expect(matchFeedShortcut(ev({ code: "KeyK", key: "k" }))).toBe("prev");
    expect(matchFeedShortcut(ev({ key: "ArrowUp" }))).toBe("prev");
  });

  it("maps Enter / Space to 'open'", () => {
    expect(matchFeedShortcut(ev({ key: "Enter" }))).toBe("open");
    expect(matchFeedShortcut(ev({ key: " " }))).toBe("open");
  });

  it("maps Escape to 'close'", () => {
    expect(matchFeedShortcut(ev({ key: "Escape" }))).toBe("close");
  });

  it("maps C to 'categories'", () => {
    expect(matchFeedShortcut(ev({ code: "KeyC", key: "c" }))).toBe("categories");
  });

  it("maps ⌥K (Option+K) to 'panel' even when macOS produces ˚", () => {
    // macOS: Option+K → e.key = "˚"; we must match by e.code = "KeyK".
    expect(
      matchFeedShortcut(ev({ code: "KeyK", key: "˚", altKey: true })),
    ).toBe("panel");
  });

  it("maps ⌥C to 'clearFilter' even when macOS produces ç", () => {
    expect(
      matchFeedShortcut(ev({ code: "KeyC", key: "ç", altKey: true })),
    ).toBe("clearFilter");
  });

  it("ignores ctrl/meta combos to avoid colliding with browser shortcuts", () => {
    expect(
      matchFeedShortcut(ev({ code: "KeyK", key: "k", ctrlKey: true })),
    ).toBeNull();
    expect(
      matchFeedShortcut(ev({ code: "KeyK", key: "k", metaKey: true })),
    ).toBeNull();
  });

  it("returns null for ⌥↵ on the feed (deep-dive only)", () => {
    expect(matchFeedShortcut(ev({ key: "Enter", altKey: true }))).toBeNull();
  });

  it("returns null for arbitrary keys", () => {
    expect(matchFeedShortcut(ev({ key: "x", code: "KeyX" }))).toBeNull();
  });
});
