import {
  getAdminSetting,
  listCategories,
} from "@armal/shared/db/queries";
import { SettingsPanels } from "./SettingsPanels";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [allCategories, ingestion, auth] = await Promise.all([
    listCategories(),
    getAdminSetting("ingestion"),
    getAdminSetting("auth"),
  ]);

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
