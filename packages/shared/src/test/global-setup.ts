import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(here, "../../drizzle");

export default async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Pure-function tests don't need DATABASE_URL; just bail out cleanly.
    return;
  }
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder });
  await sql.end();
}
