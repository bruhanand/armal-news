import { describe, expect, it } from "vitest";
import {
  closestIndexToCenter,
  matchDeepDiveShortcut,
  matchFeedShortcut,
} from "./shortcuts";

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

describe("matchDeepDiveShortcut", () => {
  it("maps ⌥↵ (Option+Enter) to 'viewSource'", () => {
    expect(matchDeepDiveShortcut(ev({ key: "Enter", altKey: true }))).toBe(
      "viewSource",
    );
  });

  it("maps Escape to 'close'", () => {
    expect(matchDeepDiveShortcut(ev({ key: "Escape" }))).toBe("close");
  });

  it("returns null for a plain Enter without Option", () => {
    expect(matchDeepDiveShortcut(ev({ key: "Enter" }))).toBeNull();
  });

  it("returns null for feed keys like J", () => {
    expect(matchDeepDiveShortcut(ev({ code: "KeyJ", key: "j" }))).toBeNull();
  });

  it("ignores ctrl/meta combos", () => {
    expect(
      matchDeepDiveShortcut(ev({ key: "Enter", altKey: true, ctrlKey: true })),
    ).toBeNull();
    expect(
      matchDeepDiveShortcut(ev({ key: "Enter", altKey: true, metaKey: true })),
    ).toBeNull();
  });
});

describe("closestIndexToCenter", () => {
  it("returns 0 for an empty card list", () => {
    expect(closestIndexToCenter([], 400)).toBe(0);
  });

  it("returns 0 for a single card", () => {
    expect(closestIndexToCenter([{ top: 0, height: 100 }], 400)).toBe(0);
  });

  it("picks the middle card when the viewport center is nearest it", () => {
    const cards = [
      { top: 0, height: 100 },
      { top: 300, height: 100 },
      { top: 600, height: 100 },
    ];
    expect(closestIndexToCenter(cards, 380)).toBe(1);
  });

  it("picks the last card when the feed is scrolled past the end", () => {
    // Every card sits above the viewport — all rect.top values negative.
    const cards = [
      { top: -900, height: 100 },
      { top: -600, height: 100 },
      { top: -300, height: 100 },
    ];
    expect(closestIndexToCenter(cards, 400)).toBe(2);
  });

  it("breaks an exact tie toward the lower index", () => {
    const cards = [
      { top: 0, height: 100 },
      { top: 700, height: 100 },
    ];
    expect(closestIndexToCenter(cards, 400)).toBe(0);
  });
});
