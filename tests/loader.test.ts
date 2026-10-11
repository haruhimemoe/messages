/**
 * @file tests/loader.test.ts
 * @desc The built loader, on a fixture tree: a namespace comes back under its own key, a locale
 *       falls back to English key by key, an unknown locale gets English, an unknown namespace
 *       throws, prototype keys are dropped. Also the real dist's lists.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const BUILD = new URL("../scripts/build.mjs", import.meta.url).pathname;
type Loader = {
  LOCALES: readonly string[];
  NAMESPACES: readonly string[];
  DEFAULT_LOCALE: string;
  loadMessages: (locale: string, namespace: string) => Promise<Record<string, unknown>>;
  messagesLoader: (namespace: string) => (locale: string) => Promise<Record<string, unknown>>;
};

const fixture = (tree: Record<string, Record<string, unknown>>): string => {
  const root = mkdtempSync(join(tmpdir(), "messages-"));
  for (const [path, data] of Object.entries(tree)) {
    const [locale = "", name = ""] = path.split("/");
    mkdirSync(join(root, "src", locale), { recursive: true });
    writeFileSync(join(root, "src", locale, `${name}.json`), JSON.stringify(data));
  }
  return root;
};
const build = (root: string) =>
  execFileSync("node", [BUILD, join(root, "src"), join(root, "dist")], { stdio: "pipe" });

describe("loader", () => {
  let lib: Loader;
  beforeAll(async () => {
    const root = fixture({
      "en/app": { title: "Packs", nested: { a: "A", b: "B" } },
      "en/common": { ok: "OK" },
      "ja/app": { nested: { a: "エー" }, __proto__: { polluted: "x" } },
    });
    build(root);
    lib = (await import(pathToFileURL(join(root, "dist", "index.js")).href)) as Loader;
  });

  it("lists locales with en first and every en namespace", () => {
    expect(lib.LOCALES).toEqual(["en", "ja"]);
    expect(lib.NAMESPACES).toEqual(["app", "common"]);
    expect(lib.DEFAULT_LOCALE).toBe("en");
  });

  it("puts a namespace under its key and falls back key by key", async () => {
    expect(await lib.loadMessages("en", "app")).toEqual({
      app: { title: "Packs", nested: { a: "A", b: "B" } },
    });
    expect(await lib.loadMessages("ja", "app")).toEqual({
      app: { title: "Packs", nested: { a: "エー", b: "B" } },
    });
    expect(await lib.loadMessages("ja", "common")).toEqual({ common: { ok: "OK" } });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("gives English for an unknown locale and throws for an unknown namespace", async () => {
    expect(await lib.messagesLoader("common")("fr")).toEqual({ common: { ok: "OK" } });
    expect(await lib.messagesLoader("common")("toString")).toEqual({ common: { ok: "OK" } });
    await expect(lib.loadMessages("en", "nope")).rejects.toThrow('no namespace "nope"');
    await expect(lib.loadMessages("en", "constructor")).rejects.toThrow();
  });
});

describe("build refuses", () => {
  it("a locale catalog English doesn't have, a missing en, bad names", () => {
    expect(() => build(fixture({ "en/a": {}, "ja/b": {} }))).toThrow();
    expect(() => build(fixture({ "ja/a": {} }))).toThrow();
    expect(() => build(fixture({ "en/Bad": {} }))).toThrow();
    expect(() => build(fixture({ "en/a": {}, "english/a": {} }))).toThrow();
  });
});

describe("dist", () => {
  it("serves the real catalogs", async () => {
    const real = (await import(
      pathToFileURL(new URL("../dist/index.js", import.meta.url).pathname).href
    )) as Loader;
    expect(real.LOCALES[0]).toBe("en");
    expect(real.NAMESPACES).toContain("ui");
    const ui = (await real.loadMessages("en", "ui")).ui as { palette: { list: string } };
    expect(ui.palette.list).toBe("Results");
  });
});
