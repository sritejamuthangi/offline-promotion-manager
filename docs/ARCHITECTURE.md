# Architecture

This document explains the main design decisions, so contributors can extend the app without
undoing them.

## Principles

1. **Local-first and private.** There is no backend. Designs, images and settings live in the
   browser. The app must work offline and never send personal data anywhere.
2. **What you see is what prints.** Designs are stored in physical units and rendered the same way
   on screen, on paper and in exports.
3. **For everyone.** Any language and writing system, right-to-left layouts, regional paper sizes,
   keyboard and screen-reader access, and phones as well as desktops.
4. **Small, testable core.** Business logic lives in plain TypeScript with no UI dependencies.

## Layers

```
features/ (React screens)  ─┐
components/ (UI kit)        ├─> storage/ (repositories) ─> IndexedDB
render/ (data -> HTML/SVG)  │
                            └─> core/ (pure TypeScript: schema, units, sizes, layout)
```

`core` never imports from the other layers. `storage` depends only on `core`. Screens depend on
everything else.

## The design file format

A design is a JSON document validated by Zod (`src/core/schema`):

- **Design**: ID, name, page size, display unit, theme, pages and metadata.
- **Page**: background fill and an ordered list of elements (first is at the back).
- **Element**: text, image, shape, line, QR code, icon, sticker or Smart Grid. New variants are
  additive, so older designs still validate.

Key rules:

- **Geometry is in CSS pixels** (1 px = 1/96 inch). Browsers print CSS pixels at exactly that
  physical size, which is what makes true-size printing possible. The unit a person picked
  (`mm`, `in`, `px`...) is stored separately and used only for display.
- **Colours and fonts can be theme slots** (`$primary`, `$heading`). Changing the theme restyles a
  whole template in one click. Literal colours must be hex, so design data can never inject CSS.
- **`schemaVersion` and migrations.** Every stored or imported design passes through
  `migrateDesign`, which upgrades older formats step by step and rejects files from newer
  versions with a clear error.
- **IDs are UUID v7.** They sort by creation time, which suits databases and future syncing.

## Storage

The UI talks to storage only through interfaces such as `DesignRepository`
(`src/storage/repositories.ts`). Today there is one implementation, backed by IndexedDB through
Dexie. Adding cloud or self-hosted sync later means writing another implementation; screens do not
change.

- Deleting moves a design to **Recently deleted** (a `deletedAt` time). It is removed for good
  after 30 days or when the person chooses "Delete forever".
- The app asks the browser for **persistent storage** after the first design is created, so the
  browser does not silently clear designs when the device runs low on space.
- Database structure changes are added as new Dexie versions; existing versions are never edited.
- Editor writes use `saveEdited(design, expectedUpdatedAt)` inside one IndexedDB transaction.
  A stale revision or deleted source is rejected. Revision timestamps advance monotonically,
  even when edits happen in the same millisecond. The editor offers a new copy for recovery.
- Uploaded images live in an `assets` table as blobs, referenced from designs as `asset:<id>`.
  A SHA-256 hash deduplicates identical files. The renderer resolves each asset through a cached
  object URL, so the same upload can appear in several designs without being stored twice.
  Nothing is uploaded to a server.
- Database version 2 adds a `templates` table. A saved template is a validated design snapshot;
  starting a new design from it regenerates design, page, element and grid-item IDs. Deleting the
  source design or template does not delete image assets referenced by other designs.

## Content and styles

`src/content/templates` contains responsive layout functions for bundled templates. A shared kit
builds ordinary design elements; each template selects regional presets and uses theme colour/font
slots. The catalogue includes 14 starting templates; step 5 expands it. `src/content/palettes.ts`
and `fontPairings.ts` provide 20 palettes and 14 pairings. Palette tests verify text contrast.

`library:<id>` sources refer to 33 deterministic SVG graphics, drawn locally using the design's
colours. Adaptive backgrounds and frames redraw for the target proportions. They use no IndexedDB
space. `useImageSrc` resolves these graphics alongside local `asset:<id>` references. Font stacks
map friendly names to the registered Fontsource families; 15 fonts are bundled under OFL-1.1.

Online image search is opt-out, persisted in settings. Pure provider URL/response helpers live in
`core/imageSearch.ts`; the UI owns cancellable requests and downloads, with timeouts and a streaming
25 MB limit. Changing providers, search options or closing the picker cancels active requests.
Selected images are stored locally with provenance, licence links and credit. Search never
transmits designs. Provider calls omit credentials and referrers.

## Editor

`src/features/editor` owns one isolated Zustand store per open design. Immer keeps immutable,
structurally shared snapshots for up to 100 undo steps. Pointer transforms, text-field edits and
held arrow-key nudges are transactions: intermediate frames render immediately, then commit as
one history entry. Escape can cancel an unfinished gesture or inline edit.

Document geometry stays in CSS pixels; the inspector converts it to the chosen display unit.
Pure helpers in `src/core` implement rotated bounds, anchored resize, group transforms, snapping,
alignment/distribution and stable layer ordering. Selection and viewport state are not saved in
the design. Zoom is cursor-anchored; touch gestures cancel a tentative element drag before panning
or zooming the viewport.

The autosave queue debounces completed edits and serializes writes, so a slow older write cannot
overwrite a newer one. It flushes on navigation, visibility changes and page exit. Browser unload
cannot guarantee asynchronous persistence, so unsaved work triggers the browser's unload prompt.
Save failures retain the pending snapshot for retry. The open editor survives an external deletion
so that its local work can still be saved as a copy.

## Rendering and printing

`src/render/PageArtwork.tsx` draws every element type with HTML and SVG: text, shapes and lines,
images, QR codes, outline icons, stickers and the Smart Grid. Both the editor and home-screen
thumbnails use it at document scale; the surrounding viewport applies scaling. Fonts, fills and
geometry therefore agree between views. Printing and exports are planned for step 6:

- QR modules come from `uqr` (MIT). The encoded text is built by pure helpers in
  `src/core/qr.ts`, which keep the Wi‑Fi, email, phone, SMS and UPI formats testable.
- Icons are a curated set of lucide components; stickers are bundled SVG silhouettes. Both are
  stored in the design by name, so no network or icon font is needed at render time.
- The Smart Grid reuses the original app's balanced row patterns
  (`src/core/layout/balancedRows.ts`) and falls back to a monogram when an item has no logo.
- Images and image fills resolve `asset:<id>` references through a cached object URL.

- Printing uses the browser's own print engine with CSS `@page` sizes, which keeps text and shapes
  sharp at any size (Chrome/Edge, Firefox 95+, Safari 18.2+).
- Text is real text, so every script is shaped correctly (including Indic scripts, Arabic and CJK),
  and "Save as PDF" in the print dialog produces true vector PDFs.
- Image exports (PNG, JPG and one-click PDF) render the same DOM at the chosen DPI.

`src/render/fill.ts` resolves background fills, and shared typography lives alongside the artwork
renderer. Editor overlays (selection, guides, handles and text input) are separate from artwork.

## Internationalisation

- All UI text lives in `src/i18n/locales/*.json`. Keys are type-checked through
  `src/i18n/i18next.d.ts`, and interpolation variables are checked as well.
- The `<html>` `lang` and `dir` attributes follow the active language, and layouts use logical CSS
  properties, so right-to-left languages work without separate styles.
- Regional defaults (`src/core/locale.ts`): US Letter and inches in the regions that use them, A4
  and millimetres elsewhere.

## Routing

TanStack Router uses browser history and clean paths. Old hash bookmarks are upgraded on entry.
`VITE_BASE_PATH` supports sub-folder deployments. Screens other than home load on demand.

`scripts/prerender.mjs` loads `src/seo/prerender.tsx` through Vite at build time and produces static
HTML for every public route. `src/seo/pages.ts` is the shared source for titles, canonical URLs,
Open Graph/Twitter tags, structured data and sitemap entries. The canonical origin defaults to
`https://opm.sritejam.com` and is configurable with `VITE_SITE_URL`. JavaScript enhances the public
HTML with the local app; pre-rendering never reads browser storage. Local editor routes are
noindex and use a separate shell; unknown public routes return 404. See `docs/DEPLOYMENT.md`.

## Testing

- **Unit tests** (Vitest) for everything in `core`, `storage` (against an in-memory IndexedDB),
  and pure helpers.
- **Browser tests** (Playwright) for home/editor flows on desktop and phone-sized screens, including
  pointer transforms, real emulated touch gestures, undo, persistence and cross-tab recovery.
- `npm run check` runs lint, type-check and unit tests; CI runs everything on every push.
