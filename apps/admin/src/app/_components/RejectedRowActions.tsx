"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminPost } from "./api";
import { useToast } from "./ToastProvider";
import { ConfirmDialog } from "./ConfirmDialog";

export function RejectedRowActions({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function restore() {
    setBusy(true);
    const r = await adminPost(`/api/admin/stories/${id}/restore`);
    setBusy(false);
    if (r.ok) {
      toast("success", `"${title}" restored to drafts.`);
      router.refresh();
    } else {
      toast("error", r.error);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    const r = await adminPost(`/api/admin/stories/${id}/delete`);
    setBusy(false);
    setConfirmDel(false);
    if (r.ok) {
      toast("success", `"${title}" deleted.`);
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
          className="btn btn-secondary btn-row"
          onClick={restore}
          disabled={busy}
        >
          Restore
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-row"
          style={{ color: "var(--danger)" }}
          onClick={() => setConfirmDel(true)}
          disabled={busy}
        >
          Delete
        </button>
      </div>
      {confirmDel && (
        <ConfirmDialog
          title="Delete this story?"
          body={
            <p>
              This permanently removes the row and its image. There&apos;s no undo.
              Prefer <em>Restore</em> if you might want to keep it.
            </p>
          }
          confirmLabel={busy ? "Deleting…" : "Delete forever"}
          confirmKind="danger"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDel(false)}
          busy={busy}
        />
      )}
    </>
  );
}
