"use client";

import { useEffect } from "react";

export function ConfirmDialog({
  title,
  body,
  confirmLabel = "Confirm",
  confirmKind = "primary",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  busy = false,
  extra,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  confirmKind?: "primary" | "danger";
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  extra?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true">
      <div className="dialog">
        <h3>{title}</h3>
        <div>
          {typeof body === "string" ? <p>{body}</p> : body}
        </div>
        {extra}
        <div className="dialog-acts">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-${confirmKind === "danger" ? "danger" : "primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
