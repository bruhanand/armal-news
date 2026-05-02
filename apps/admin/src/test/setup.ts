import { afterAll, beforeEach } from "vitest";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL must be set to run integration tests");

const sql = postgres(url, { max: 1 });

beforeEach(async () => {
  await sql`TRUNCATE TABLE stories RESTART IDENTITY CASCADE`;
});

afterAll(async () => {
  await sql.end();
});
