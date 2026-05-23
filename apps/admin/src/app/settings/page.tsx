import {
  getAdminSetting,
  listCategories,
} from "@armal/shared/db/queries";
import { OpenClawHealth } from "@armal/shared/validation/admin-settings";
import { SettingsPanels } from "./SettingsPanels";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [allCategories, ingestion, auth, health] = await Promise.all([
    listCategories(),
    getAdminSetting("ingestion"),
    getAdminSetting("auth"),
    getAdminSetting("openclaw_health"),
  ]);

  // OpenClaw writes its own value via the heartbeat endpoint; if something
  // landed there before slice 0011's schema was finalised, fall through
  // gracefully rather than crashing the page.
  const parsedHealth = health
    ? OpenClawHealth.safeParse(health.value)
    : null;
  const healthValue = parsedHealth?.success ? parsedHealth.data : null;

  return (
    <>
      <div className="content-head">
        <div className="ch-title">Settings</div>
      </div>
      <div className="settings-shell">
        <SettingsPanels
          categories={allCategories.map((c) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            sortOrder: c.sortOrder,
          }))}
          ingestion={(ingestion?.value as IngestionSettings | undefined) ?? null}
          auth={(auth?.value as AuthSettings | undefined) ?? null}
          health={healthValue}
        />
      </div>
    </>
  );
}

// Shape contracts — the panels mirror these. Storage layer is jsonb so any
// new key can extend without a migration; just version the consumer.
export type IngestionSettings = {
  pollIntervalMinutes?: number;
  rssSourceUrls?: string[];
  autoDraftThreshold?: number;
};

export type AuthSettings = {
  email?: string;
  sessionTimeoutMinutes?: number;
};
