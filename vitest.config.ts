/**
 * @file vitest.config.ts
 * @desc Vitest config: every test under tests/. `bun run test` builds dist/ first.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { defineConfig } from "vitest/config";

export default defineConfig({ test: { include: ["tests/**/*.test.ts"] } });
