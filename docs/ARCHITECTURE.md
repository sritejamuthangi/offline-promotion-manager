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
slots. The catalogue includes 50 templates across seven categories. `src/content/palettes.ts`
and `fontPairings.ts` provide 20 palettes and 14 pairings. Palette tests verify text contrast.

Templates use regular editable elements, including replaceable image placeholders, rather than
flattened pictures. Layout tests build every design at both regional sizes and browser tests measure
text after the bundled fonts load. Register new templates in `src/content/templates/index.ts`; their
public detail pages and sitemap entries are generated automatically.

`library:<id>` sources refer to 33 deterministic SVG graphics, drawn locally using the design's
colours. Adaptive backgrounds and frames redraw for the target proportions. They use no IndexedDB
space. `useImageSrc` resolves these graphics alongside local `asset:<id>` references.

### Fonts and writing systems

`src/core/fonts.ts` is the font registry. 15 design fonts cover Latin, Greek and Cyrillic, and 24
Noto fonts cover the other widely used writing systems; all are bundled from Fontsource under
OFL-1.1. `fontStack` builds each text's CSS stack: the chosen font, Inter for missing Latin, Greek
or Cyrillic letters, every writing-system font, then a generic family for emoji. The writing
systems a text uses come first, in order of appearance, so shared characters (such as the danda in
Bengali) come from the matching font. Chinese, Japanese and Korean share Chinese characters but draw
them differently: kana select Japanese, hangul select Korean, and otherwise the design's
`meta.locale` decides (`Hant` locales use traditional Chinese, others simplified).

Fontsource splits every font into `unicode-range` subsets, so browsers fetch only the subsets a text
uses. The writing-system stylesheets (about 440 KB, mostly CJK ranges) are a separate CSS chunk:
`loadScriptFonts` imports it the first time a rendered page contains such text, and printing and
exports wait for it. Latin-only designs never download it. Exports embed exactly the faces the
browser would choose: `selectFaces` walks each text run's stack per character, mirroring font
fallback, so an export carries the Japanese subsets of a Japanese text and no unrelated Latin or
Chinese faces. Chosen fonts must load; a writing-system fallback that cannot load (for example
offline before it was ever used) is skipped and the device's fonts draw that text.

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
thumbnails use it at document scale; the surrounding viewport applies scaling. Printing and exports
reuse the same markup and typography. Artwork uses inline styles so exports are independent of
the app's stylesheet:

- QR modules come from `uqr` (MIT). The encoded text is built by pure helpers in
  `src/core/qr.ts`, which keep the Wi‑Fi, email, phone, SMS and UPI formats testable.
- Icons are a curated set of lucide components; stickers are bundled SVG silhouettes. Both are
  stored in the design by name, so no network or icon font is needed at render time.
- The Smart Grid reuses the original app's balanced row patterns
  (`src/core/layout/balancedRows.ts`) and falls back to a monogram when an item has no logo.
- Images and image fills resolve `asset:<id>` references through a cached object URL.

- Printing uses the browser's own print engine with CSS `@page` sizes, keeping text and shapes
  sharp. Browser and printer support determines available physical paper sizes.
- Text is real text, shaped by the browser with the bundled writing-system fonts (including Indic
  scripts, Arabic, Hebrew and CJK), and "Save as PDF" in the print dialog produces vector PDFs.
- Image exports (PNG, JPG and direct PDF) render the same DOM at the chosen DPI.

### Print layout and lifecycle

`src/core/print/layout.ts` is a pure imposition planner. All sheet sizes, placements, clips, overlap
and marks remain in CSS pixels. It handles actual-size and fitted pages, repeated copies with
automatic orientation, and overlapping poster tiles. Print defaults follow the person's regional
paper settings and the design size. Geometry generation stops at 200 sheets; the UI blocks jobs
that exceed the sheet or copy limit rather than printing a truncated job.

`src/features/print/PrintSheetView.tsx` renders both the preview and real output. `PrintArtwork`
clips an expanded design to the bleed ring and keeps the original artwork inside the trim box, so
adding bleed does not change photo crops or gradients on the finished page. Saved designs are never
modified by print settings. Crop marks remain outside the bleed; poster ticks and labels indicate
tile position and overlap.

The editor snapshots its latest committed state when opening print options, including focused
edits via Ctrl/⌘+P. `PrintJob` resolves local assets, waits for images and fonts, and renders sheets
in a body-level portal. A print-only stylesheet hides the app and supplies physical `@page` sizes
in millimetres. `afterprint` and print-media changes re-enable printing, but the sheets stay ready
until the dialog closes or another print starts: some phone browsers return from `window.print()`
immediately and lay out the printout later. Errors and dialog closure remove the job and restore the
page title, which is set to the design name so "Save as PDF" suggests a sensible file name.
Cancelled image preparation cannot create a stale print job after closing the dialog.

### Download pipeline

`exportFiles.tsx` embeds IndexedDB images as data URLs and the used bundled font faces/subsets as
inline `@font-face` rules. A self-contained SVG `foreignObject` holds the shared XHTML artwork;
the browser draws this onto a canvas at the requested DPI. Fonts use the HTTP cache and an
in-memory data-URL cache. Opening the Download panel prepares the required faces before enabling
the action, so disconnecting afterwards does not depend on the browser's font-response cache.
Failed loads can be retried. Missing assets or failed font loads reject
the export instead of silently omitting content; with the service worker (below), font files
come from the device's offline copy.

Canvas dimensions are bounded to 16,384 pixels per side and 50 megapixels on desktops, or 16.7
megapixels on coarse-pointer devices. Resolution reduction is shown in the UI. PNG `pHYs` and JPEG
JFIF density metadata retain the intended physical size. Canvases are released after encoding.

The dependency-free PDF writer embeds one RGB JPEG per page, vector crop marks, and physical
MediaBox/TrimBox/BleedBox coordinates. PDF 1.6 `UserUnit` preserves sizes beyond the normal
200-inch coordinate limit. Binary stream lengths and cross-reference offsets are byte-counted;
metadata supports Unicode. The UI distinguishes raster PDF downloads from browser-generated PDFs
with vector/selectable text. Files have no watermark; app credit stays in the UI and README.

`src/render/fill.ts` resolves background fills, and shared typography lives alongside the artwork
renderer. Editor overlays (selection, guides, handles and text input) are separate from artwork.

## Offline use and installation

`src/pwa/sw.ts` is the service worker. `scripts/prerender.mjs` builds it after the pages, with
the file lists of that build (`src/pwa/plan.ts` decides them) and a version hash of the saved
files:

- **Installed with the app (about 4 MB):** all JavaScript and CSS, the design fonts' WOFF2 files,
  icons, the manifest and two start pages (`index.html`, and `editor.html`, whose client router
  can open any screen). `cache.addAll` saves a version atomically with revalidated requests.
- **Saved on demand:** the writing-system fonts (`offline-fonts.json` lists them). The worker
  saves each the first time it is fetched; Settings can save them all. Their cache survives
  updates; files a new version no longer uses are removed when it activates.
- **Screens:** navigations go to the network first, so public pages stay current, and fall back
  to the saved start page when offline or after 4 seconds. Paths with a file extension (such as
  `sitemap.xml`) are never answered with the app. Requests to other origins, such as online image
  search, are not intercepted.
- Saved files are matched with `ignoreVary`: their names contain content hashes, and hosts may add
  `Vary: Origin`, which module scripts and fonts would otherwise never match offline.

A new version installs in the background and waits. `src/pwa/register.ts` offers **Update**, which
asks it to `skipWaiting`; every open tab reloads on `controllerchange`, so no page keeps running
code whose files were removed. The first install takes control without a reload. Registration
starts after the page's `load` event, checks for updates hourly and is skipped in development.

Settings shows readiness, Chromium's deferred `beforeinstallprompt`, iPhone and iPad instructions,
and saving all fonts with progress. The manifest is generated from `APP` with relative URLs, so a
build works at the domain root and in a sub-folder. Icons are rendered from `favicon.svg` by
`scripts/generate-icons.mjs` (run manually after changing the logo).

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
- Offline browser tests run with the service worker (other suites block it): they reload an editor
  link, open screens and create designs offline, and save every font to render and export Japanese
  and Thai text offline.
- World-script browser tests check the per-text font order, that Latin-only designs never load the
  writing-system fonts, and that exports embed only the faces drawing the text.
- Print/export browser tests verify physical dimensions, multiple-copy and poster pagination,
  custom/US paper, print cleanup and failures, latest-edit snapshots, decodable PNG/JPG and DPI
  metadata, multi-page PDF boxes, offline uploaded images/fills, bleed and large-banner limits.
- `npm run check` runs lint, type-check and unit tests; CI runs everything on every push.
