import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Dummy values only: tests never contact Supabase or the database.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://unit-test.supabase.invalid",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "unit-test-publishable-key",
    },
  },
});
