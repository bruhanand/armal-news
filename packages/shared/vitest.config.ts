import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// Best-effort .env load; CI sets DATABASE_URL via env directly.
config({ path: path.resolve(here, "../../.env") });

export default defineConfig({
  test: {
    // Pure tests run unconditionally; the DB-backed queries.test.ts brings its
    // own per-file globalSetup + setupFiles entry, so we register them here at
    // the project level for that file's needs. Pure tests ignore both.
    globalSetup: ["./src/test/global-setup.ts"],
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
