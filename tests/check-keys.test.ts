/**
 * @file tests/check-keys.test.ts
 * @desc messages-check-keys on a fixture app: present keys pass, a missing literal, a missing
 *       rich key and a missing template prefix fail with their file and path.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const BIN = new URL("../bin/check-keys.mjs", import.meta.url).pathname;
const run = (source: string) => {
  const dir = mkdtempSync(join(tmpdir(), "keys-"));
  writeFileSync(join(dir, "page.tsx"), source);
  return spawnSync("node", [BIN, dir], { encoding: "utf8" });
};

describe("messages-check-keys", () => {
  it("passes keys that exist", () => {
    const result = run(`
      const t = await getTranslations("ui.palette");
      const ui = useTranslations("ui");
      t("list"); t.rich("results", {}); ui(\`palette.\${x}\`); ui("shell.skip");
    `);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("4 keys ok");
  });

  it("fails missing literal, rich and template keys", () => {
    const result = run(`
      const t = await getTranslations("ui");
      t("palette.nope"); t.rich("nothing.here"); t(\`missing.\${x}\`);
    `);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("3 missing");
    expect(result.stderr).toContain("ui.palette.nope");
    expect(result.stderr).toContain("ui.nothing.here");
    expect(result.stderr).toContain("ui.missing");
  });

  it("needs a directory", () => {
    expect(spawnSync("node", [BIN], { encoding: "utf8" }).status).toBe(2);
  });
});
