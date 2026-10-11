# Contributing

## Translating

Thank you! Translations are JSON files in `messages/<language>/`. English in `messages/en/` is the source.

1. Find your language's code: `ja`, `ko`, `de`, `pt-BR`, `zh-Hans` and so on ([BCP 47](https://www.w3.org/International/questions/qa-choosing-language-tags)).
2. Copy the English file you want to translate into `messages/<code>/` with the same name, for example `messages/en/packs.json` to `messages/ja/packs.json`.
3. Translate the values. Keep the keys, and keep everything in `{braces}` as it is:
   - `{name}` is replaced by a value. Move it wherever your language needs it.
   - `{count, plural, one {# map} other {# maps}}` picks a form by number. Translate the words inside each form, and use your language's plural categories (`zero`, `one`, `two`, `few`, `many`, `other`). Japanese only needs `other`.
4. You don't have to translate everything. Delete keys you skip: they show in English.
5. Open a pull request. CI checks that every key exists in English and that the `{arguments}` match.

Tone: short and plain, like the English. "osu!" stays "osu!". Mod names (HD, DT) and osu! terms (beatmap, mappool) follow what your language's osu! community already says.

Not sure about a phrase? Ask in the pull request.

## Code

You need [Bun](https://bun.sh) (the repo pins 1.4.2 in `packageManager`) and Node 22.12 or later.

```sh
bun install
bun run check && bun run typecheck && bun run test && bun run test:dist
```

| Script | What it does |
| --- | --- |
| `bun run build` | `scripts/build.mjs`: `messages/` to `dist/`, one module per catalog and the loader. |
| `bun run test` | Builds, then Vitest: catalog checks and the loader on fixtures. |
| `bun run test:dist` | Builds and loads every catalog through the exports map in Node. |
