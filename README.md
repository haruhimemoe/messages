# @haruhimemoe/messages

The translation catalogs for the [haruhime.moe](https://www.haruhime.moe) osu! tools and the harumin Discord bot. English is the source. Every other language translates what it can, and anything it hasn't translated yet shows in English.

Want to translate? See [CONTRIBUTING.md](./CONTRIBUTING.md). No code needed: you edit JSON files and open a pull request.

## Install

```sh
bun add @haruhimemoe/messages
```

No dependencies. Node 22.12 or later, or any bundler that handles `import()`.

## Use

Each catalog is one namespace: `ui` for [@haruhimemoe/ui](https://github.com/haruhimemoe/ui) and next-kit's built-in text, `common` for what every tool shares, and one per app (`packs`, `pools`, `bb`, `tourney`, `hub`, `harumin-site`, `harumin-bot`).

```ts
import { loadMessages, messagesLoader, LOCALES, NAMESPACES } from "@haruhimemoe/messages";

await loadMessages("ja", "packs"); // { packs: { ... } }, English for any key ja lacks
```

With next-intl through [@haruhimemoe/next-kit](https://github.com/haruhimemoe/next-kit), without locale prefixes in URLs:

```ts
// i18n/request.ts
import { messagesLoader } from "@haruhimemoe/messages";
import { createRequestConfig, readRequestLocale } from "@haruhimemoe/next-kit/i18n/next-intl";

export default createRequestConfig({
  config: { locales: ["en", "ja"], defaultLocale: "en" },
  packages: [messagesLoader("ui"), messagesLoader("common")],
  app: messagesLoader("packs"),
  request: readRequestLocale,
});
```

Then `useTranslations("packs")`, and next-kit's `uiLabels(useTranslations("ui"))` gives ui's components their text.

## API

| Export | What it is |
| --- | --- |
| `loadMessages(locale, namespace)` | `Promise<{ [namespace]: Catalog }>`. Keys the locale lacks come from English, nested objects merged. An unknown locale gets English. An unknown namespace throws. |
| `messagesLoader(namespace)` | `(locale) => loadMessages(locale, namespace)`, the shape next-kit's `createRequestConfig` takes. |
| `LOCALES` | Every locale with at least one catalog, `"en"` first. |
| `NAMESPACES` | Every namespace. |
| `DEFAULT_LOCALE` | `"en"`. |
| `Catalog`, `Namespace` | Types. |

Messages use [ICU message syntax](https://unicode-org.github.io/icu/userguide/format_parse/messages/): `{name}` for a value, `{count, plural, one {# map} other {# maps}}` for plurals.

## Checking an app's keys

`messages-check-keys <dir>` scans an app's source for next-intl translators (`getTranslations("ns")`, `useTranslations("ns.sub")`) and fails when a literal key they're called with isn't in the English catalogs. A template key is checked up to its first placeholder. `--scope harumin-bot` also reads harumin's `const t = scope("render")` translators as keys under `harumin-bot.render`.

```sh
bunx messages-check-keys src
```

## License

MIT
