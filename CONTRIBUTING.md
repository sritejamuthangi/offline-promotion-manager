# Contributing

Thank you for helping make free, private design tools available to everyone. Taking part means
agreeing to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

- **Report a bug or suggest an idea** by opening an issue. Screenshots and the steps to reproduce help a lot.
- **Translate the app** into your language (see below).
- **Design templates.** A contribution guide for templates arrives with the template system (step 4 of the roadmap in the README).
- **Write code or improve the docs.**

## Development setup

1. Install [Node.js](https://nodejs.org/) 22.12 or newer.
2. `npm install`
3. `npm run dev` and open the address it prints.

Before opening a pull request, run:

```bash
npm run check      # lint + type-check + unit tests
npm run test:e2e   # browser tests (see README for using an installed browser)
```

The [Biome extension](https://biomejs.dev/guides/editors/first-party-extensions/) formats and lints
in your editor. `npm run lint:fix` fixes most issues automatically.

## Ground rules

These keep the app private, fast and usable worldwide.

- **Privacy first.** No analytics, tracking, ads or third-party CDNs. The app must keep working
  offline. Network requests are allowed only for features the person turns on and understands
  (for example, the planned online image search).
- **No hard-coded UI text.** Every visible string goes through i18n (`src/i18n/locales/en.json`).
  Keys are type-checked, so a typo fails the build.
- **Right-to-left ready.** Use logical CSS utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`,
  `end-*`, `text-start`) instead of left/right.
- **Accessible.** Every control works with a keyboard and has a label screen readers can announce.
  Prefer the components in `src/components/ui`.
- **Keep `src/core` pure.** No React or browser-only APIs there, so the logic stays easy to test and
  reusable (for example by a future server or command-line tool).
- **Changing the design file format** (`src/core/schema`) needs a schema version bump and a
  migration in `migrations.ts`, so designs people already saved keep opening.
- **Tests.** New logic comes with unit tests; new user flows come with a browser test.

## Translations

1. Copy `src/i18n/locales/en.json` to `src/i18n/locales/<language-code>.json` (for example `hi.json`).
2. Translate the values only. Keep the keys and the `{{placeholders}}` unchanged.
3. Register the language in `src/i18n/index.ts`.
4. Open a pull request. A native speaker review is very welcome.

## Images, icons, fonts and other assets

Everything bundled with the app must be free for anyone to use, including commercially. That
protects every person who prints a design made with it.

**Allowed:** CC0 / public domain, MIT, ISC, Apache-2.0, and the SIL Open Font License for fonts.
CC BY is allowed only with the required attribution recorded in the asset's metadata.

**Not allowed:** images from Unsplash, Pexels or Pixabay, unDraw illustrations, anything whose
licence forbids redistribution in another app or library, and anything with an unclear licence.

Always record the source URL and licence of every asset you add.

## Pull requests

- Keep each pull request focused on one change and describe what it does and why.
- Add screenshots for visual changes, on a phone-sized screen too.
- Make sure `npm run check` passes.
