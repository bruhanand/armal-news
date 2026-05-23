"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminPost } from "./api";
import { useToast } from "./ToastProvider";
import { ConfirmDialog } from "./ConfirmDialog";

export function DraftRowActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function publish() {
    setBusy(true);
    const r = await adminPost(`/api/admin/stories/${id}/publish`);
    setBusy(false);
    if (r.ok) {
      toast("success", `"${title}" published.`);
      router.refresh();
    } else {
      toast("error", r.error);
    }
  }

  async function confirmReject() {
    setBusy(true);
    const body = reason.trim() ? { reason: reason.trim() } : undefined;
    const r = await adminPost(`/api/admin/stories/${id}/reject`, body);
    setBusy(false);
    setRejectOpen(false);
    setReason("");
    if (r.ok) {
      toast("success", `"${title}" rejected.`);
      router.refresh();
    } else {
      toast("error", r.error);
    }
  }

  return (
    <>
      <div className="act-row">
        <button
          type="button"
          className="btn btn-success btn-row"
          onClick={publish}
          disabled={busy}
        >
          ✓ Publish
        </button>
        <button
          type="button"
          className="btn btn-danger btn-row"
          onClick={() => setRejectOpen(true)}
          disabled={busy}
        >
          ✕ Reject
        </button>
      </div>
      {rejectOpen && (
        <ConfirmDialog
          title="Reject this story?"
          body={
            <p>
              This will move the story to <strong>Rejected</strong>. It won&apos;t be
              published and can be reviewed later from the Rejected tab.
            </p>
          }
          confirmLabel={busy ? "Rejecting…" : "Reject story"}
          confirmKind="danger"
          onConfirm={confirmReject}
          onCancel={() => {
            setRejectOpen(false);
            setReason("");
          }}
          busy={busy}
          extra={
            <div className="field" style={{ marginTop: 4 }}>
              <label>Reason (optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Unverified claim"
                autoFocus
              />
            </div>
          }
        />
      )}
    </>
  );
}
