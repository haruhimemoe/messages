# AGENTS.md

`@haruhimemoe/messages`: the translation catalogs for the haruhime.moe tools and harumin. Data plus a tiny generated loader. Nothing else lives here.

## Rules

- **English is the source.** `messages/en/<namespace>.json` defines every key. Other locales only translate keys that exist in English, with the same ICU arguments (`tests/catalogs.test.ts`).
- **No runtime dependencies.** `scripts/build.mjs` is plain Node. The generated loader lists every catalog as a literal `import()` so bundlers include them. No globs, no import attributes.
- **Never machine-translate into this repo.** Translations come from people who speak the language. Machine output is for local testing only.
- **A namespace is an app or a shared surface.** `ui` mirrors `@haruhimemoe/ui` and next-kit text (`next-kit`'s `uiLabels` reads it, keep the keys in step). `common` is what several apps share. Every other namespace is one app.
- **Renaming or removing an English key is a minor version on 0.x.** Apps read keys by name. Adding keys is a patch.
- **Changelog.** A change users can see gets a line under `## [Unreleased]` in `CHANGELOG.md`. Never rewrite a released entry.
- **Releases are cut by the maintainers.** Don't bump the version, tag, push or publish unless a maintainer asks.
- Code style: Biome. Every script and test file starts with the `@file / @desc / @author / @created / @modified` header.

## Layout

| Path | What's there |
| --- | --- |
| `messages/<locale>/<namespace>.json` | The catalogs. |
| `scripts/build.mjs` | Builds `dist/` (`node scripts/build.mjs [source] [out]`). |
| `scripts/smoke.mjs` | Loads every catalog through the exports map. |
| `tests/catalogs.test.ts` | Key and argument parity against English. |
| `tests/loader.test.ts` | The built loader on fixture trees. |

## Before calling a change done

```sh
bun run check && bun run typecheck && bun run test && bun run test:dist
```
