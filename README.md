<div align="center">
  <img src="public/favicon.svg" width="72" height="72" alt="" />
  <h1>Offline Promotion Manager</h1>
  <p><strong>Design anything. Print any size.</strong></p>
  <p>
    A free, open-source design and print studio that runs entirely on your device.<br />
    No account, no server, no tracking: your designs never leave your computer or phone.
  </p>
</div>

---

## Why this exists

- **Free for everyone.** Every template and feature, no paywall, no watermark on your prints.
- **Private.** Designs and images are saved only in your browser (IndexedDB). Nothing is uploaded.
- **Made to print at true size.** Sizes are stored in real units, so an A4 design is exactly 210 × 297 mm on paper. Printing at any size, from A6 up to A0 or custom, arrives in step 6 below.
- **Made for the whole world.** A4 and millimetres or US Letter and inches depending on your region (already working), with every writing system and right-to-left languages as the editor grows.
- **Open source (MIT).** Use it, change it, host it yourself, ship it in your own products.

## Status

This project is being rebuilt from a single-purpose poster maker into a general design studio. The
balanced card layout of that first version lives on in the Smart Grid element.

- [x] **Phase 0: foundation.** Project setup, design file format, storage, tests, CI, licence.
- [x] **Step 1: saving and home screen.** Create designs in about 50 preset sizes or any custom size; rename, duplicate, delete with undo, Recently deleted; light and dark theme; settings.
- [x] **Step 2: editor.** Text, seven shapes and lines; select, move, resize, rotate, snapping guides, alignment/distribution, layers, undo/redo, local autosave, pan/zoom and touch gestures.
- [x] **Step 3: elements.** Images, outline icons, stickers, QR codes (links, Wi‑Fi, email, calls, messages and UPI payments), Smart Grid with logos, image fills, borders, shadows and richer text styling.
- [x] **Step 4: content system.** Searchable template catalogue with 14 starter designs, 20 colour palettes, 14 font pairings, built-in graphics, optional Openverse/Wikimedia Commons image search and local save-as-template.
- [ ] **Step 5: starter library.** About 50 templates across business, education, events, greetings, food, signs and social media.
- [ ] **Step 6: printing and export.** Any paper size, poster tiling across sheets, several copies per sheet, bleed and crop marks, PDF/PNG/JPG.
- [ ] **Step 7: worldwide and finishing.** Fonts for every script, phone layouts, offline install, backup and restore.

## Getting started

Public site: **https://opm.sritejam.com**.

You need [Node.js](https://nodejs.org/) 22.12 or newer.

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

### Try the editor

Create a design from the home screen, then add text, a shape, a line, an image, an icon, a sticker,
a QR code or a Smart Grid. Use **Properties** for exact positions and sizes in your chosen units,
typography, colours, gradients, borders and shadows. **Layers** lets you select overlapping
elements, change their order, hide them or lock them. On phones and tablets, these panels open
below the canvas; use two fingers to pan and zoom.

**Images** lets you upload from your device, reuse a previous upload, pick one of 33 built-in
graphics or search Openverse/Wikimedia Commons. Chosen online images are downloaded into the local
database with their source, licence and credit; **Properties → Credit** can add a credit line to
the page. Online search is enabled by default and can be turned off in **Settings**. Built-in
graphics follow the design's colours. Identical uploads are stored once. **Elements** offers a
curated set of outline icons and decorative stickers. **QR code** creates a scannable code for a
website, plain text, Wi‑Fi network, email, phone call, text message or UPI payment; the encoded
content can still be edited afterwards in Properties. **Smart Grid** recreates the balanced company
rows of the original app: add, reorder and remove items, attach a logo to each, choose the cards per
row, and style the cards and their text.

Text and images support borders and shadows. Text also has letter spacing, letter case, vertical
alignment, strikethrough and an outline, and its font weight can be set per template. Shapes and
stickers take solid or gradient fills; page backgrounds and Smart Grid cards can also use an image
fill.

Each completed edit saves automatically on this device. The header shows save status; if storage
fails, use **Retry save**. If another tab changes or deletes the same design, **Save as a copy**
preserves your version. Returning home flushes the latest edit and updates the design thumbnail.

### Templates and styles

Browse **Templates**, search by name or subject, or choose a category. Each bundled template has
a shareable public page and adapts to A4 or US paper sizes. **Use this template** creates a fully
editable local design. **Styles** applies one-click colour palettes and heading/body font pairings;
15 bundled fonts are available in the font picker. Custom colours and fonts remain editable.

Use **Save as template** in the editor header or a home-screen design menu. It stores an independent
snapshot under **Your templates**. Rename or delete saved templates from their preview, or start
as many new designs from them as you like.

| Action                                | Control                                                                |
| ------------------------------------- | ---------------------------------------------------------------------- |
| Move / resize / rotate                | Drag the element / its handles / the rotation handle                   |
| Edit text                             | Double-click it, press Enter with it selected, or use Properties       |
| Finish / cancel inline text           | Ctrl/⌘ + Enter / Escape                                                |
| Select several                        | Shift-click, drag an empty-space selection box, or enable multi-select |
| Select all editable elements          | Ctrl/⌘ + A                                                             |
| Undo / redo                           | Ctrl/⌘ + Z / Ctrl/⌘ + Shift + Z                                        |
| Duplicate / copy / paste              | Ctrl/⌘ + D / C / V (within the open design)                            |
| Nudge                                 | Arrow keys (1 px); Shift + arrows (10 px)                              |
| Constrain resize / rotation           | Hold Shift (aspect ratio / 15° steps)                                  |
| Resize from centre / bypass snapping  | Hold Alt                                                               |
| Pan / zoom                            | Space + drag / Ctrl/⌘ + scroll, or the on-screen controls              |
| Add text / rectangle / ellipse / line | T / R / O / L                                                          |

Keyboard shortcuts apply when focus is outside text and number fields. Multilingual text uses
the browser's shaping and the fonts available on your device; additional bundled script fonts
are planned. Printing and export arrive in step 6.

| Command            | What it does                                                 |
| ------------------ | ------------------------------------------------------------ |
| `npm run dev`      | Start the development server with live reload                |
| `npm run build`    | Type-check and build the static site into `dist/`            |
| `npm run preview`  | Serve the built site locally                                 |
| `npm run check`    | Lint, type-check and run the unit tests                      |
| `npm test`         | Unit tests (Vitest)                                          |
| `npm run test:e2e` | Browser tests on desktop and phone screen sizes (Playwright) |

For browser tests you can reuse a browser you already have instead of downloading one:
`$env:PW_CHANNEL = 'msedge'` (PowerShell) or `PW_CHANNEL=chrome` (bash) before `npm run test:e2e`.
Otherwise run `npx playwright install chromium` once.

### Hosting

`npm run build` produces static files in `dist/`, including pre-rendered home, catalogue, category,
template and settings pages. Public URLs use clean paths, with metadata and a sitemap targeting
**https://opm.sritejam.com**. Old `/#/…` bookmarks still open their corresponding pages.

Vercel routing is in `vercel.json`; Netlify/Cloudflare Pages rules are generated in `dist/_redirects`.
Configure the host's custom domain and DNS for `opm.sritejam.com`. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for other hosts, sub-folder builds and indexing setup.

## How it is built

| Part         | Choice                                                      |
| ------------ | ----------------------------------------------------------- |
| Build        | Vite 8, TypeScript 7 (strict)                               |
| UI           | React 19, Tailwind CSS 4, Radix UI primitives, lucide icons |
| Routing      | TanStack Router (clean URLs, lazy-loaded screens)           |
| State        | Zustand with Immer snapshots for undo/redo                  |
| Storage      | IndexedDB through Dexie, behind repository interfaces       |
| Images       | Local blobs in IndexedDB, deduplicated by SHA-256           |
| QR codes     | `uqr` (MIT), with pure payload builders in `core`           |
| File format  | Versioned JSON validated with Zod, with migrations          |
| Translations | i18next with type-checked keys                              |
| Quality      | Biome (lint and format), Vitest, Playwright, GitHub Actions |

```
src/
  core/        Pure TypeScript: design format, units, paper sizes, layout, QR payloads. No React, fully tested.
  content/     Templates, palettes, font pairings and offline graphics.
  storage/     IndexedDB database and repositories (swap in a server database later).
  features/    Screens: home, design, editor, settings.
  components/  Shared UI components.
  render/      Shared HTML/SVG artwork for editor and thumbnails; printing follows.
  i18n/        Translations.
  app/         App shell, routing, theme.
  seo/         Public-page metadata and build-time HTML generation.
scripts/       Static page and sitemap build.
tests/e2e/     Browser tests.
docs/          Architecture notes.
```

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the design decisions.

## Contributing

Contributions of every size are welcome: bug reports, translations, templates, code and docs.
Start with [CONTRIBUTING.md](CONTRIBUTING.md). Everyone taking part agrees to the
[Code of Conduct](CODE_OF_CONDUCT.md). Please report security problems privately, as described in
[SECURITY.md](SECURITY.md).

## Privacy

The app has no backend. It does not collect analytics, set tracking cookies, or send your designs
anywhere. Everything is stored in your browser on your device, so clearing the site's data in your
browser deletes your designs. A backup and restore feature is planned.

Optional online image search sends your search words to the selected provider. Results and image
downloads contact the provider and image hosts. Requests omit credentials and referrers; your
designs and uploaded files are never sent. Turn off **Online image search** in Settings to disable
this feature. Editing and bundled content use local resources; installable offline caching is
planned for step 7.

## License

[MIT](LICENSE). Free to use, change and share.

Bundled fonts use SIL Open Font License 1.1; lucide icons and `uqr` retain their own open-source
licences. The build includes their full licence texts in `THIRD-PARTY-NOTICES.txt`. Online images
retain the licences shown by their source.

---

Built by [Sriteja Muthangi](https://www.linkedin.com/in/sritejamuthangi/).
