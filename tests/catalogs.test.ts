/**
 * @file tests/catalogs.test.ts
 * @desc The catalogs themselves: English is complete, every other locale only translates keys
 *       English has, with the same ICU arguments, and nothing is empty.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Catalog = { [key: string]: string | Catalog };
const SOURCE = new URL("../messages", import.meta.url).pathname;
const read = (locale: string, file: string): Catalog =>
  JSON.parse(readFileSync(join(SOURCE, locale, file), "utf8"));
const flat = (catalog: Catalog, prefix = ""): Map<string, string> => {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(catalog)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else for (const [k, v] of flat(value, path)) out.set(k, v);
  }
  return out;
};
// The top-level ICU argument names: "{count, plural, ...}" and "{name}" give count and name.
const args = (message: string): string[] => {
  const names = new Set<string>();
  let depth = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message[i];
    if (char === "{") {
      if (depth === 0) names.add(/^\{\s*([A-Za-z0-9_]+)/.exec(message.slice(i))?.[1] ?? "");
      depth++;
    } else if (char === "}") depth--;
  }
  return [...names].sort();
};

const locales = readdirSync(SOURCE);
const english = new Map(
  readdirSync(join(SOURCE, "en")).map((file) => [file, flat(read("en", file))] as const),
);

describe("en", () => {
  it("has catalogs, every message a non-empty string with balanced braces", () => {
    expect(english.size).toBeGreaterThan(0);
    for (const [file, messages] of english) {
      expect(messages.size, file).toBeGreaterThan(0);
      for (const [key, message] of messages) {
        expect(message.trim(), `${file} ${key}`).not.toBe("");
        expect(message.split("{").length, `${file} ${key}`).toBe(message.split("}").length);
      }
    }
  });
});

describe.each(locales.filter((locale) => locale !== "en"))("%s", (locale) => {
  it("translates only English keys, with the same arguments", () => {
    for (const file of readdirSync(join(SOURCE, locale))) {
      const base = english.get(file);
      expect(base, `${locale}/${file} has no en catalog`).toBeDefined();
      for (const [key, message] of flat(read(locale, file))) {
        const source = base?.get(key);
        expect(source, `${locale}/${file} ${key} is not in en`).toBeDefined();
        expect(message.trim(), `${locale}/${file} ${key}`).not.toBe("");
        expect(args(message), `${locale}/${file} ${key}`).toEqual(args(source ?? ""));
      }
    }
  });
});
