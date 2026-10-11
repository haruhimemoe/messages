#!/usr/bin/env node
/**
 * @file bin/check-keys.mjs
 * @desc messages-check-keys <dir...> [--scope <namespace>]: finds next-intl translators (and,
 *       with --scope, harumin's scope() ones) in an app's source
 *       (`const t = await getTranslations("ns")`, `useTranslations("ns.sub")`, `uiLabels(...)`
 *       aside) and checks every literal key they're called with exists in the English catalogs
 *       of @haruhimemoe/messages. A template key (`features.${x}.title`) is checked up to its
 *       first placeholder. Exits 1 and lists what's missing.
 * @author David @dvhsh (https://dvh.sh)
 * @created Sun Oct 11, 2026
 * @modified Sun Oct 11, 2026
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const CATALOGS = new URL("../dist/en/", import.meta.url);
// --scope <namespace>: also read `const t = scope("x")` translators (harumin's src/i18n.ts) as
// keys under "<namespace>.x".
const scopeAt = process.argv.indexOf("--scope");
const scopeNamespace = scopeAt === -1 ? null : process.argv[scopeAt + 1];
const dirs = process.argv
  .slice(2)
  .filter((arg, i, all) => arg !== "--scope" && all[i - 1] !== "--scope");
if (dirs.length === 0) {
  console.error("usage: messages-check-keys <src dir> [more dirs]");
  process.exit(2);
}

const english = {};
for (const file of readdirSync(CATALOGS)) {
  if (!file.endsWith(".js")) continue;
  const text = readFileSync(new URL(file, CATALOGS), "utf8");
  english[file.slice(0, -3)] = JSON.parse(
    text.replace(/^export default /, "").replace(/;\s*$/, ""),
  );
}

const lookup = (path) => {
  let node = english;
  for (const part of path.split(".")) {
    if (typeof node !== "object" || node === null || !Object.hasOwn(node, part)) return undefined;
    node = node[part];
  }
  return node;
};

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(tsx?|mts)$/.test(name) && !/\.test\./.test(name)) files.push(path);
  }
};
for (const dir of dirs) walk(dir);

const TRANSLATOR =
  /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:getTranslations|useTranslations)\(\s*(?:\{\s*namespace:\s*)?["'`]([^"'`]+)["'`]/g;
const missing = [];
let checked = 0;
for (const file of files) {
  const source = readFileSync(file, "utf8");
  const found = [...source.matchAll(TRANSLATOR)].map(([, name, namespace]) => [name, namespace]);
  if (scopeNamespace) {
    for (const [, name, prefix] of source.matchAll(
      /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*scope\(\s*["'`]([^"'`]+)["'`]/g,
    )) {
      found.push([name, `${scopeNamespace}.${prefix}`]);
    }
  }
  for (const [name, namespace] of found) {
    const call = new RegExp(
      `(?<![\\w$.])${name.replace(/\$/g, "\\$")}(?:\\.(?:rich|markup|raw|has))?\\(\\s*(["'\`])((?:(?!\\1).)*)\\1`,
      "g",
    );
    for (const [, quote, key] of source.matchAll(call)) {
      const literal = quote === "`" ? key.split("${")[0].replace(/\.$/, "") : key;
      const path = literal ? `${namespace}.${literal}` : namespace;
      checked++;
      if (lookup(path) === undefined) missing.push(`${file}: ${path}`);
    }
  }
}

if (missing.length > 0) {
  console.error(`messages-check-keys: ${missing.length} missing\n${missing.join("\n")}`);
  process.exit(1);
}
console.log(`messages-check-keys: ${checked} keys ok`);
