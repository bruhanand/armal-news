// Tiny runner for the local-dev seed: reads dev.sql and executes it as a
// single statement against DATABASE_URL via postgres-js. Wired to
// `pnpm db:seed` at the repo root. Plain .mjs so it runs under Node without
// an extra ts loader.
import { config } from "dotenv";
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../../.env") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required (set it in .env or the environment).");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });
const seed = readFileSync(resolve(here, "dev.sql"), "utf8");

try {
  const rows = await sql.unsafe(seed);
  const last = rows.at(-1);
  console.log(last?.result ?? "seed complete");
} catch (err) {
  console.error("seed failed:", err);
  process.exit(1);
} finally {
  await sql.end();
}
