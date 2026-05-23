import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

// Mobile unit tests only cover pure-TS helpers (api client, source-host
// parser, theme reducer). React Native rendering tests would require a
// jest + RN-test-renderer stack and aren't worth the maintenance cost for
// MVP — the visual contract is owned by the design pack and verified by
// running the Expo dev server in Expo Go.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(here, "./src"),
    },
  },
});
