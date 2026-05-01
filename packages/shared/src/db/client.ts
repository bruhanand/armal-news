import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { __armalDb?: Db };

export function getDb(): Db {
  if (!globalForDb.__armalDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    const queryClient = postgres(url);
    globalForDb.__armalDb = drizzle(queryClient, { schema });
  }
  return globalForDb.__armalDb;
}
