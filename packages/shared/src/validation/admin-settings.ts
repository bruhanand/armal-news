import { z } from "zod";
import { isHttpUrl } from "../lib/url";

// Validates a single RSS / Atom URL. javascript:/data:/ftp: schemes are
// rejected — OpenClaw will fetch these.
const rssFeedUrl = z
  .string()
  .url()
  .refine(isHttpUrl, { message: "must be an http(s) URL" });

// Shape of the `ingestion` key in admin_settings. Shared between the Admin
// Dashboard (writes via Settings → Ingestion) and OpenClaw (reads via
// GET /api/admin/openclaw/config). OpenClaw is expected to vendor this file
// rather than depend on the workspace (see docs/openclaw-contract.md).
export const IngestionConfig = z
  .object({
    pollIntervalMinutes: z.number().int().min(1).max(24 * 60),
    rssSourceUrls: z.array(rssFeedUrl),
    autoDraftThreshold: z.number().min(0).max(1),
  })
  .strict();

export type IngestionConfig = z.infer<typeof IngestionConfig>;

// Shape of admin_settings.openclaw_health. Written by OpenClaw via
// POST /api/admin/openclaw/heartbeat after each ingest cycle; read by the
// Settings page to render an "OpenClaw connected" status badge.
export const OPENCLAW_INGEST_STATUSES = ["ok", "error"] as const;

export const OpenClawHealth = z
  .object({
    lastSeen: z.string().datetime(),
    lastIngestStatus: z.enum(OPENCLAW_INGEST_STATUSES),
    lastIngestMessage: z.string().max(500).optional(),
  })
  .strict();

export type OpenClawHealth = z.infer<typeof OpenClawHealth>;
