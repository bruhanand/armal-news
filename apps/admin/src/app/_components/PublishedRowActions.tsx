"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminPost } from "./api";
import { useToast } from "./ToastProvider";
import { ConfirmDialog } from "./ConfirmDialog";

export function PublishedRowActions({
  id,
  title,
  slug,
}: {
  id: string;
  title: string;
  slug: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  async function confirmUnpublish() {
    setBusy(true);
    const r = await adminPost(`/api/admin/stories/${id}/unpublish`);
    setBusy(false);
    setOpen(false);
    if (r.ok) {
      toast("success", `"${title}" un-published.`);
      router.refresh();
    } else {
      toast("error", r.error);
    }
  }

  return (
    <>
      <div className="act-row">
        <Link href={`/stories/${id}`} className="btn btn-secondary btn-row">
          Edit
        </Link>
        <button
          type="button"
          className="btn btn-ghost btn-row"
          onClick={() => setOpen(true)}
          disabled={busy}
        >
          Un-publish
        </button>
      </div>
      {open && (
        <ConfirmDialog
          title="Un-publish this story?"
          body={
            <p>
              This will hide the story from <code>/story/{slug}</code> and the
              public feed. <strong>Anyone who already shared the URL will hit a 404.</strong>
              {" "}You can re-publish it later from the Drafts list.
            </p>
          }
          confirmLabel={busy ? "Un-publishing…" : "Un-publish"}
          confirmKind="danger"
          onConfirm={confirmUnpublish}
          onCancel={() => setOpen(false)}
          busy={busy}
        />
      )}
    </>
  );
}
