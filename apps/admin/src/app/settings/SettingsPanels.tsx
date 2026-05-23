"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminPatch } from "../_components/api";
import { useToast } from "../_components/ToastProvider";
import type { OpenClawHealth } from "@armal/shared/validation/admin-settings";
import type { AuthSettings, IngestionSettings } from "./page";

type CategoryProp = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
};

export function SettingsPanels({
  categories,
  ingestion,
  auth,
  health,
}: {
  categories: CategoryProp[];
  ingestion: IngestionSettings | null;
  auth: AuthSettings | null;
  health: OpenClawHealth | null;
}) {
  return (
    <>
      <IngestionPanel initial={ingestion} health={health} />
      <div className="divider" />
      <CategoriesPanel initial={categories} />
      <div className="divider" />
      <AuthPanel initial={auth} />
    </>
  );
}

// "4 min ago" / "just now" — short, low-precision; the badge is glanceable, not
// a metric. Caps at "1d+" because beyond a day the loop is broken anyway.
function relativeTime(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const sec = Math.floor(ms / 1000);
  if (sec < 30) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return "1d+ ago";
}

function HealthBadge({ health }: { health: OpenClawHealth | null }) {
  if (!health) {
    return (
      <div className="info-banner">
        Waiting for OpenClaw heartbeat. Once OpenClaw polls{" "}
        <code>/api/admin/openclaw/config</code> and POSTs to{" "}
        <code>/api/admin/openclaw/heartbeat</code>, this badge will go live.
      </div>
    );
  }
  const ok = health.lastIngestStatus === "ok";
  return (
    <div className={`openclaw-status openclaw-status-${ok ? "ok" : "err"}`}>
      <span className="dot" aria-hidden="true" />
      <span className="lbl">
        {ok ? "OpenClaw connected" : "OpenClaw error"}
      </span>
      <span className="muted">· last ingest {relativeTime(health.lastSeen)}</span>
      {health.lastIngestMessage ? (
        <span className="msg">— {health.lastIngestMessage}</span>
      ) : null}
    </div>
  );
}

function IngestionPanel({
  initial,
  health,
}: {
  initial: IngestionSettings | null;
  health: OpenClawHealth | null;
}) {
  const toast = useToast();
  const [pollInterval, setPollInterval] = useState(
    String(initial?.pollIntervalMinutes ?? 15),
  );
  const [autoDraftThreshold, setAutoDraftThreshold] = useState(
    String(initial?.autoDraftThreshold ?? 0.72),
  );
  const [urls, setUrls] = useState<string[]>(initial?.rssSourceUrls ?? []);
  const [busy, setBusy] = useState(false);

  function setUrl(i: number, v: string) {
    setUrls((prev) => prev.map((u, idx) => (idx === i ? v : u)));
  }
  function removeUrl(i: number) {
    setUrls((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addUrl() {
    setUrls((prev) => [...prev, ""]);
  }

  async function save() {
    setBusy(true);
    const value: IngestionSettings = {
      pollIntervalMinutes: Number(pollInterval) || 0,
      rssSourceUrls: urls.map((u) => u.trim()).filter(Boolean),
      autoDraftThreshold: Number(autoDraftThreshold) || 0,
    };
    const r = await adminPatch("/api/admin/settings/ingestion", { value });
    setBusy(false);
    if (r.ok) toast("success", "Ingestion settings saved.");
    else toast("error", r.error);
  }

  return (
    <section className="settings-panel">
      <h2>Ingestion pipeline</h2>
      <p className="muted">
        RSS sources and ingest behaviour. Changes take effect on the next poll
        cycle.
      </p>
      <HealthBadge health={health} />
      <div className="field">
        <label>Poll interval (minutes)</label>
        <input
          type="text"
          value={pollInterval}
          onChange={(e) => setPollInterval(e.target.value)}
          style={{ width: 120 }}
        />
      </div>
      <div className="field">
        <label>RSS / Atom source URLs</label>
        {urls.map((u, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 5 }}>
            <input
              type="text"
              value={u}
              onChange={(e) => setUrl(i, e.target.value)}
            />
            <button
              type="button"
              className="btn btn-ghost btn-row"
              style={{ color: "var(--danger)" }}
              onClick={() => removeUrl(i)}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="tag-add"
          onClick={addUrl}
        >
          + Add source
        </button>
      </div>
      <div className="field">
        <label>Auto-draft threshold</label>
        <input
          type="text"
          value={autoDraftThreshold}
          onChange={(e) => setAutoDraftThreshold(e.target.value)}
          style={{ width: 120 }}
        />
        <div className="field-hint">
          Stories with AI confidence score ≥ this value are auto-drafted.
          Below → discarded.
        </div>
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={save}
        disabled={busy}
      >
        {busy ? "Saving…" : "Save ingestion settings"}
      </button>
    </section>
  );
}

function CategoriesPanel({ initial }: { initial: CategoryProp[] }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState<CategoryProp[]>(initial);
  const [busy, setBusy] = useState(false);

  function setName(id: string, name: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
  }
  function setOrder(id: string, sortOrder: number) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, sortOrder } : r)),
    );
  }

  async function save() {
    setBusy(true);
    // Diff against initial — only PATCH rows where name or sort_order changed.
    const initialById = new Map(initial.map((r) => [r.id, r]));
    const dirty = rows.filter((r) => {
      const i = initialById.get(r.id);
      return !i || i.name !== r.name || i.sortOrder !== r.sortOrder;
    });
    let okCount = 0;
    for (const r of dirty) {
      const res = await adminPatch(`/api/admin/categories/${r.id}`, {
        name: r.name,
        sort_order: r.sortOrder,
      });
      if (res.ok) okCount++;
      else {
        toast("error", `${r.slug}: ${res.error}`);
        setBusy(false);
        return;
      }
    }
    setBusy(false);
    if (dirty.length === 0) toast("success", "No category changes to save.");
    else toast("success", `${okCount} categor${okCount === 1 ? "y" : "ies"} saved.`);
    router.refresh();
  }

  const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="settings-panel">
      <h2>Categories</h2>
      <p className="muted">
        Rename categories or reorder their display position by editing
        sort order. The slug is locked — admin name overrides survive
        re-seeding (ADR 0004 § F).
      </p>
      <div>
        {sorted.map((r) => (
          <div key={r.id} className="cat-row">
            <input
              type="number"
              value={r.sortOrder}
              onChange={(e) => setOrder(r.id, Number(e.target.value))}
              aria-label={`${r.slug} sort order`}
            />
            <input
              type="text"
              value={r.name}
              onChange={(e) => setName(r.id, e.target.value)}
              aria-label={`${r.slug} name`}
            />
            <span className="cat-slug">{r.slug}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={save}
          disabled={busy}
        >
          {busy ? "Saving…" : "Save categories"}
        </button>
      </div>
    </section>
  );
}

function AuthPanel({ initial }: { initial: AuthSettings | null }) {
  const toast = useToast();
  const [email, setEmail] = useState(initial?.email ?? "admin@armal.news");
  const [sessionTimeout, setSessionTimeout] = useState(
    String(initial?.sessionTimeoutMinutes ?? 480),
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const value: AuthSettings = {
      email: email.trim(),
      sessionTimeoutMinutes: Number(sessionTimeout) || 0,
    };
    const r = await adminPatch("/api/admin/settings/auth", { value });
    setBusy(false);
    if (r.ok) toast("success", "Auth settings saved.");
    else toast("error", r.error);
  }

  return (
    <section className="settings-panel">
      <h2>Auth</h2>
      <p className="muted">
        Admin access is Tailscale-gated. These settings are for the
        post-Tailscale session behaviour.
      </p>
      <div className="info-banner">
        Active when admin moves off Tailscale (ADR-0003 migration trigger).
        The form saves to <code>admin_settings.auth</code> but nothing reads
        from it yet (ADR 0004 § P).
      </div>
      <div className="field">
        <label>Admin email</label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ maxWidth: 320 }}
        />
      </div>
      <div className="field">
        <label>Session timeout (minutes)</label>
        <input
          type="text"
          value={sessionTimeout}
          onChange={(e) => setSessionTimeout(e.target.value)}
          style={{ width: 120 }}
        />
        <div className="field-hint">
          Set to 0 for no timeout while on Tailscale.
        </div>
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={save}
        disabled={busy}
      >
        {busy ? "Saving…" : "Save auth settings"}
      </button>
    </section>
  );
}
