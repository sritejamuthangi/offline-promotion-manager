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
render/ (data -> CSS)       │
                            └─> core/ (pure TypeScript: schema, units, sizes, layout)
```

`core` never imports from the other layers. `storage` depends only on `core`. Screens depend on
everything else.

## The design file format

A design is a JSON document validated by Zod (`src/core/schema`):

- **Design**: ID, name, page size, display unit, theme, pages and metadata.
- **Page**: background fill and an ordered list of elements (first is at the back).
- **Element**: text, image, shape or line. More types (QR codes, icons, Smart Grid) join as the
  editor grows.

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

## Rendering and printing (planned)

Designs will be drawn with HTML and SVG rather than a bitmap canvas. One renderer serves the
editor, thumbnails, printing and export:

- Printing uses the browser's own print engine with CSS `@page` sizes, which keeps text and shapes
  sharp at any size (Chrome/Edge, Firefox 95+, Safari 18.2+).
- Text is real text, so every script is shaped correctly (including Indic scripts, Arabic and CJK),
  and "Save as PDF" in the print dialog produces true vector PDFs.
- Image exports (PNG, JPG and one-click PDF) render the same DOM at the chosen DPI.

`src/render/fill.ts` is the first piece of this renderer.

## Internationalisation

- All UI text lives in `src/i18n/locales/*.json`. Keys are type-checked through
  `src/i18n/i18next.d.ts`, and interpolation variables are checked as well.
- The `<html>` `lang` and `dir` attributes follow the active language, and layouts use logical CSS
  properties, so right-to-left languages work without separate styles.
- Regional defaults (`src/core/locale.ts`): US Letter and inches in the regions that use them, A4
  and millimetres elsewhere.

## Routing

TanStack Router with **hash URLs** (`/#/design/<id>`), so the static build works on any host and in
any sub-folder without server rewrite rules. Screens other than home load on demand.

## Testing

- **Unit tests** (Vitest) for everything in `core`, `storage` (against an in-memory IndexedDB),
  and pure helpers.
- **Browser tests** (Playwright) for user flows, on a desktop and a phone-sized screen.
- `npm run check` runs lint, type-check and unit tests; CI runs everything on every push.
