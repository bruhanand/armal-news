"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminPatch, adminPost } from "../../_components/api";
import { useToast } from "../../_components/ToastProvider";
import { ConfirmDialog } from "../../_components/ConfirmDialog";

type StoryProp = {
  id: string;
  status: "draft" | "published";
  title: string;
  shortSummary: string;
  // Already-sanitized HTML stored in the DB. The editor lets the admin edit
  // the *markdown* source, so we don't seed the textarea from this — we
  // start with an empty textarea + Preview tab that renders the saved HTML.
  bodyHtml: string;
  imageUrl: string;
  sourceLink: string;
  externalId: string;
  slug: string;
  tags: string[];
};

const SHORT_SUMMARY_MAX = 280;

export function StoryEditor({
  story,
  allCategories,
  initialSlugs,
}: {
  story: StoryProp;
  allCategories: Array<{ slug: string; name: string }>;
  initialSlugs: string[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState(story.title);
  const [shortSummary, setShortSummary] = useState(story.shortSummary);
  // Body field is markdown source the admin types; the saved HTML
  // (story.bodyHtml) is what readers see. The first edit replaces it.
  const [bodyMd, setBodyMd] = useState("");
  const [sourceLink, setSourceLink] = useState(story.sourceLink);
  const [tags, setTags] = useState<string[]>(story.tags);
  const [newTag, setNewTag] = useState("");
  const [slugs, setSlugs] = useState<string[]>(initialSlugs);
  const [bodyTab, setBodyTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Preview renders through the same sanitizer the public deep-dive uses
  // (ADR 0004 § E) — admin preview ≡ public render byte-for-byte. The
  // sanitizer is server-side only, so we POST the markdown to a thin
  // /api/admin/preview-markdown route. When the body field is empty the
  // admin sees the currently-saved HTML.
  const [previewHtml, setPreviewHtml] = useState<string>(story.bodyHtml);
  useEffect(() => {
    if (bodyTab !== "preview") return;
    if (bodyMd.length === 0) {
      setPreviewHtml(story.bodyHtml);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/admin/preview-markdown", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body_markdown: bodyMd }),
      });
      if (cancelled) return;
      if (res.ok) {
        const { html } = (await res.json()) as { html: string };
        if (!cancelled) setPreviewHtml(html);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bodyTab, bodyMd, story.bodyHtml]);

  const validationErrors: string[] = [];
  if (!title.trim()) validationErrors.push("Title is required.");
  if (!shortSummary.trim()) validationErrors.push("Summary is required.");
  if (shortSummary.length > SHORT_SUMMARY_MAX)
    validationErrors.push(`Summary must be ${SHORT_SUMMARY_MAX} characters or fewer.`);
  if (slugs.length === 0) validationErrors.push("Select at least one category.");

  function toggleCategory(slug: string) {
    setSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function addTag() {
    const v = newTag.trim().replace(/^#/, "");
    if (!v) return;
    if (tags.includes(v)) {
      setNewTag("");
      return;
    }
    setTags((prev) => [...prev, v]);
    setNewTag("");
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  async function save(): Promise<boolean> {
    if (validationErrors.length > 0) return false;
    setSaving(true);
    const patch: Record<string, unknown> = {
      title: title.trim(),
      short_summary: shortSummary.trim(),
      source_link: sourceLink.trim(),
      tags,
      category_slugs: slugs,
    };
    if (bodyMd.length > 0) patch.body_markdown = bodyMd;
    const r = await adminPatch(`/api/admin/stories/${story.id}`, patch);
    setSaving(false);
    if (r.ok) {
      setSavedAt(new Date());
      toast("success", `"${title.trim()}" saved.`);
      router.refresh();
      return true;
    }
    toast("error", r.error);
    return false;
  }

  async function publish() {
    const saved = await save();
    if (!saved) return;
    setSaving(true);
    const r = await adminPost(`/api/admin/stories/${story.id}/publish`);
    setSaving(false);
    if (r.ok) {
      toast("success", `"${title.trim()}" published.`);
      router.push("/published");
    } else {
      toast("error", r.error);
    }
  }

  async function confirmReject() {
    setSaving(true);
    const body = rejectReason.trim() ? { reason: rejectReason.trim() } : undefined;
    const r = await adminPost(`/api/admin/stories/${story.id}/reject`, body);
    setSaving(false);
    setRejectOpen(false);
    setRejectReason("");
    if (r.ok) {
      toast("success", `"${title.trim()}" rejected.`);
      router.push("/");
    } else {
      toast("error", r.error);
    }
  }

  return (
    <>
      {validationErrors.length > 0 && (
        <div className="val-banner">
          <strong>
            Fix {validationErrors.length}{" "}
            {validationErrors.length === 1 ? "error" : "errors"} before
            publishing:
          </strong>{" "}
          {validationErrors.join(" ")}
        </div>
      )}

      <div className="form-section">
        <div className="form-section-title">Image</div>
        <div className="img-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={story.imageUrl} alt="" />
          <span className="img-badge">Read-only · set at ingest</span>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Content</div>
        <div className="field">
          <label>
            Title <span className="req">*</span>
          </label>
          <input
            type="text"
            className={!title.trim() ? "error" : ""}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {!title.trim() && (
            <div className="field-err">Title is required</div>
          )}
        </div>
        <div className="field">
          <label>
            Short summary <span className="req">*</span>
          </label>
          <input
            type="text"
            className={
              !shortSummary.trim() || shortSummary.length > SHORT_SUMMARY_MAX
                ? "error"
                : ""
            }
            value={shortSummary}
            onChange={(e) => setShortSummary(e.target.value)}
          />
          {!shortSummary.trim() && (
            <div className="field-err">Summary is required</div>
          )}
          {shortSummary.length > SHORT_SUMMARY_MAX && (
            <div className="field-err">
              Must be {SHORT_SUMMARY_MAX} characters or fewer
            </div>
          )}
          <div className="field-hint">
            {shortSummary.length} / {SHORT_SUMMARY_MAX}
          </div>
        </div>
        <div className="field">
          <label>
            Body <span className="req">*</span>{" "}
            <span style={{ fontWeight: 400, color: "var(--muted)" }}>
              (Markdown — sanitized at save time)
            </span>
          </label>
          <div className="tab-row">
            <button
              type="button"
              className={`tab-btn${bodyTab === "edit" ? " active" : ""}`}
              onClick={() => setBodyTab("edit")}
            >
              Edit
            </button>
            <button
              type="button"
              className={`tab-btn${bodyTab === "preview" ? " active" : ""}`}
              onClick={() => setBodyTab("preview")}
            >
              Preview
            </button>
          </div>
          {bodyTab === "edit" ? (
            <textarea
              rows={10}
              value={bodyMd}
              onChange={(e) => setBodyMd(e.target.value)}
              placeholder="Markdown body. Leave blank to keep the currently saved body."
            />
          ) : (
            <div
              className="preview-pane"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>
        <div className="field">
          <label>Source link</label>
          <input
            type="text"
            value={sourceLink}
            onChange={(e) => setSourceLink(e.target.value)}
          />
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Categories</div>
        <div className="cat-grid">
          {allCategories.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={`cat-pill${slugs.includes(c.slug) ? " selected" : ""}`}
              onClick={() => toggleCategory(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">Tags</div>
        <div className="tags-row">
          {tags.map((t) => (
            <span key={t} className="tag-chip">
              #{t}
              <button
                type="button"
                className="tc-x"
                onClick={() => removeTag(t)}
                aria-label={`Remove tag ${t}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="add tag"
            style={{ width: 140, height: 24, fontSize: 11, padding: "2px 8px" }}
          />
          <button
            type="button"
            className="tag-add"
            onClick={addTag}
            disabled={!newTag.trim()}
          >
            + Add
          </button>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">External ID</div>
        <div className="id-display">{story.externalId}</div>
      </div>

      <div className="divider" />

      <div className="action-bar">
        <button
          type="button"
          className="btn btn-success"
          onClick={publish}
          disabled={saving || validationErrors.length > 0}
        >
          ✓ {story.status === "published" ? "Re-publish" : "Publish"}
        </button>
        {story.status === "draft" && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setRejectOpen(true)}
            disabled={saving}
          >
            ✕ Reject
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={save}
          disabled={saving || validationErrors.length > 0}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <div className={`save-status${savedAt ? "" : " idle"}`}>
          {saving
            ? "Saving…"
            : savedAt
              ? `Saved ${relTimeShort(savedAt)} ago`
              : "Not saved yet"}
        </div>
      </div>

      {rejectOpen && (
        <ConfirmDialog
          title="Reject this story?"
          body={
            <p>
              This will move the story to <strong>Rejected</strong>. You can
              restore it later from the Rejected tab.
            </p>
          }
          confirmLabel={saving ? "Rejecting…" : "Reject story"}
          confirmKind="danger"
          onConfirm={confirmReject}
          onCancel={() => {
            setRejectOpen(false);
            setRejectReason("");
          }}
          busy={saving}
          extra={
            <div className="field" style={{ marginTop: 4 }}>
              <label>Reason (optional)</label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
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

function relTimeShort(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}
