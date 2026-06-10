import { defineConfig } from "vitest/config"

/* Scope to our own tests — repos/effect (vendored submodule) ships thousands
   of its own test files that must not run here. */
export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"]
  }
})
