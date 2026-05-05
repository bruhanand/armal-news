"use client";

import { useEffect } from "react";
import { XIcon } from "./icons";
import { SHORTCUTS } from "./shortcuts";

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--backdrop)]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[420px] max-w-[calc(100vw-32px)] rounded-sheet border border-border bg-surface p-7 shadow-drop"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close shortcuts"
          className="absolute right-3.5 top-3.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-bg text-muted hover:text-fg"
        >
          <XIcon className="h-[11px] w-[11px]" />
        </button>
        <h3 className="mb-5 font-display text-[20px] font-medium tracking-[-0.005em] text-fg">
          Keyboard shortcuts
        </h3>
        <div>
          {SHORTCUTS.map((row, i) => (
            <div
              key={row.action}
              className={`flex items-center justify-between py-2.5 text-sm text-muted ${
                i === 0 ? "" : "border-t border-border"
              }`}
            >
              <span className="font-medium text-fg">{row.label}</span>
              <span className="inline-flex items-center gap-[3px]">
                {row.keys.map((k, j) => (
                  <span key={k} className="inline-flex items-center gap-[3px]">
                    {j > 0 && row.keys[j - 1] !== "⌥" && (
                      <span className="px-1 text-[11px] text-muted">or</span>
                    )}
                    <kbd className="inline-block min-w-[26px] rounded-[5px] border border-border border-b-2 bg-bg px-[7px] py-0.5 text-center font-mono text-[11px] text-fg">
                      {k}
                    </kbd>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
