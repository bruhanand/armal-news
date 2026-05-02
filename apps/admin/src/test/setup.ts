import { beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "@armal/shared/db";

beforeEach(async () => {
  await getDb().execute(sql`TRUNCATE TABLE stories RESTART IDENTITY CASCADE`);
});
