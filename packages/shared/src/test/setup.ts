import { beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "../db/client";

beforeEach(async () => {
  if (!process.env.DATABASE_URL) return;
  await getDb().execute(sql`TRUNCATE TABLE stories RESTART IDENTITY CASCADE`);
});
