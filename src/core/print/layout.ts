import { toPx } from '../units';

/**
 * Print imposition: where each design goes on each sheet of paper. Pure geometry in CSS px
 * (1/96 in), so a plan prints at true size through the browser and is easy to test.
 */
export type PrintLayout = 'single' | 'multiple' | 'poster';
export type SheetOrientation = 'auto' | 'portrait' | 'landscape';

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Size {
  x: number;
  y: number;
}

/** Most printers cannot print right up to the paper edge, so layouts keep this border blank. */
export const PRINT_MARGIN = toPx(5, 'mm');
/** Poster tiles keep a wider border for cut marks and sheet labels. */
export const POSTER_MARGIN = toPx(10, 'mm');
/** Space between the bleed edge and the start of a crop mark. */
export const MARK_GAP = toPx(2, 'mm');
export const MARK_LENGTH = toPx(5, 'mm');
/** Layouts with crop marks always keep at least this much room for every mark. */
export const MIN_MARK_LENGTH = toPx(2, 'mm');
/** Crop mark line width: a quarter of a point, the usual hairline. */
export const MARK_STROKE = toPx(0.25, 'pt');
/** Preview generation is bounded; limited jobs must be reduced before printing. */
export const MAX_SHEETS = 200;
export const MAX_COPIES = 1000;

const EPS = 0.01;

export interface PrintOptions {
  layout: PrintLayout;
  /** Paper size in CSS px, in either orientation. */
  paper: Size;
  orientation: SheetOrientation;
  /** One per sheet: scale each page to fill the paper inside the margins. */
  fitToPaper: boolean;
  /** Several per sheet: copies of each page. */
  copies: number;
  /** Several per sheet: space between neighbouring copies, px. */
  gap: number;
  /** Poster: printed size relative to the design (1 = actual size). */
  posterScale: number;
  /** Poster: artwork repeated on neighbouring sheets, to glue or tape them together, px. */
  overlap: number;
  /** Crop marks around each design, or cut marks and labels on poster tiles. */
  marks: boolean;
  /** Artwork beyond the trim edge, px. Printed only with crop marks. */
  bleed: number;
  /** Blank border at the paper edge, px. Defaults to a printer-safe border for the layout. */
  margin?: number;
}

export interface Placement {
  pageIndex: number;
  /** Top-left corner of the trim box on the sheet (of the turned box when `rotated`). */
  x: number;
  y: number;
  scale: number;
  /** Turned a quarter turn clockwise, to fit more copies on the sheet. */
  rotated: boolean;
  /** The part of the sheet the artwork covers: its bleed box, or one poster tile. */
  clip: Rect;
}

export interface MarkLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PrintSheet {
  placements: Placement[];
  marks: MarkLine[];
  /** Poster tiles: the tile's place in the poster, counted from 0. */
  tile?: { row: number; column: number };
}

export interface PrintPlan {
  /** Sheet size in the orientation used. */
  sheet: Size;
  sheets: PrintSheet[];
  /** Designs per sheet (several per sheet), or sheets per page (poster); otherwise 1. */
  perSheet: number;
  scale: number;
  rotated: boolean;
  /** Bleed actually printed, px (none without crop marks). */
  bleed: number;
  /** False when the design does not fit on the paper as chosen. */
  fits: boolean;
  /** The artwork reaches into the border most printers can't print. */
  edgeToEdge: boolean;
  /** The job was cut short at MAX_SHEETS. */
  limited: boolean;
  /** Poster: tiles across and down (1 × 1 for other layouts). */
  grid: { columns: number; rows: number };
  /** One printed design (its trim box) after scaling. */
  printedSize: Size;
}

export function orientationOf(size: Size): 'portrait' | 'landscape' {
  return size.width > size.height ? 'landscape' : 'portrait';
}

export function orient(paper: Size, orientation: 'portrait' | 'landscape'): Size {
  const short = Math.min(paper.width, paper.height);
  const long = Math.max(paper.width, paper.height);
  return orientation === 'portrait'
    ? { width: short, height: long }
    : { width: long, height: short };
}

/** Sheet orientations worth trying, the preferred one first. */
function sheetOptions(
  paper: Size,
  orientation: SheetOrientation,
  preferred: 'portrait' | 'landscape',
): Size[] {
  if (orientation !== 'auto') return [orient(paper, orientation)];
  const first = orient(paper, preferred);
  const other = orient(paper, preferred === 'portrait' ? 'landscape' : 'portrait');
  return Math.abs(first.width - other.width) < EPS ? [first] : [first, other];
}

/** Space a crop mark takes outside the trim edge, including the bleed. */
export function markSpace(bleed: number): number {
  return Math.max(0, bleed) + MARK_GAP + MARK_LENGTH;
}

/** A sheet exactly the size of the design, plus room for full-length crop marks. */
export function designSheet(design: Size, marks: boolean, bleed: number): Size {
  const extra = marks ? markSpace(bleed) : 0;
  return { width: design.width + 2 * extra, height: design.height + 2 * extra };
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

function uniqueSorted(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.filter((value, i) => i === 0 || value - (sorted[i - 1] ?? value) > 0.1);
}

/**
 * Crop marks continuing each cut line outside a block of trim boxes. Marks start `offset`
 * from the block (clear of the bleed) and use the room left before the paper edge.
 */
function cutMarks(
  xs: number[],
  ys: number[],
  block: Rect,
  offset: number,
  sheet: Size,
): MarkLine[] {
  const top = block.y - offset;
  const bottom = block.y + block.height + offset;
  const left = block.x - offset;
  const right = block.x + block.width + offset;
  const up = Math.min(MARK_LENGTH, top);
  const down = Math.min(MARK_LENGTH, sheet.height - bottom);
  const before = Math.min(MARK_LENGTH, left);
  const after = Math.min(MARK_LENGTH, sheet.width - right);
  const marks: MarkLine[] = [];
  for (const x of uniqueSorted(xs)) {
    if (up > EPS) marks.push({ x1: x, y1: top - up, x2: x, y2: top });
    if (down > EPS) marks.push({ x1: x, y1: bottom, x2: x, y2: bottom + down });
  }
  for (const y of uniqueSorted(ys)) {
    if (before > EPS) marks.push({ x1: left - before, y1: y, x2: left, y2: y });
    if (after > EPS) marks.push({ x1: right, y1: y, x2: right + after, y2: y });
  }
  return marks;
}

function emptyPlan(sheet: Size, printedSize: Size): PrintPlan {
  return {
    sheet,
    sheets: [],
    perSheet: 0,
    scale: 1,
    rotated: false,
    bleed: 0,
    fits: false,
    edgeToEdge: false,
    limited: false,
    grid: { columns: 1, rows: 1 },
    printedSize,
  };
}

function planSingle(design: Size, pages: readonly number[], o: PrintOptions): PrintPlan {
  const bleed = o.marks ? Math.max(0, o.bleed) : 0;
  const margin = o.margin ?? PRINT_MARGIN;
  const room = o.marks ? MARK_GAP + MIN_MARK_LENGTH : 0;
  let best: { sheet: Size; scale: number; fits: boolean } | undefined;
  for (const sheet of sheetOptions(o.paper, o.orientation, orientationOf(design))) {
    let scale = 1;
    let fits: boolean;
    if (o.fitToPaper) {
      scale = Math.min(
        (sheet.width - 2 * (margin + room)) / (design.width + 2 * bleed),
        (sheet.height - 2 * (margin + room)) / (design.height + 2 * bleed),
      );
      fits = scale > 0;
      scale = Math.max(scale, Number.EPSILON);
    } else {
      fits =
        design.width + 2 * (bleed + room) <= sheet.width + EPS &&
        design.height + 2 * (bleed + room) <= sheet.height + EPS;
    }
    if (!best || (fits && !best.fits) || (fits === best.fits && scale > best.scale + EPS))
      best = { sheet, scale, fits };
  }
  if (!best) return emptyPlan(o.paper, design);
  const { sheet, scale, fits } = best;
  const width = design.width * scale;
  const height = design.height * scale;
  const x = (sheet.width - width) / 2;
  const y = (sheet.height - height) / 2;
  const b = bleed * scale;
  const clip = { x: x - b, y: y - b, width: width + 2 * b, height: height + 2 * b };
  const marks = o.marks
    ? cutMarks([x, x + width], [y, y + height], { x, y, width, height }, b + MARK_GAP, sheet)
    : [];
  return {
    sheet,
    sheets: pages.slice(0, MAX_SHEETS).map((pageIndex) => ({
      placements: [{ pageIndex, x, y, scale, rotated: false, clip }],
      marks,
    })),
    perSheet: 1,
    scale,
    rotated: false,
    bleed,
    fits,
    edgeToEdge: clip.x < margin - EPS || clip.y < margin - EPS,
    limited: pages.length > MAX_SHEETS,
    grid: { columns: 1, rows: 1 },
    printedSize: { width, height },
  };
}

function fitCount(available: number, cell: number, spacing: number): number {
  if (!(cell > 0) || available + EPS < cell) return 0;
  return Math.floor((available + spacing + EPS) / (cell + spacing));
}

function planMultiple(design: Size, pages: readonly number[], o: PrintOptions): PrintPlan {
  const bleed = o.marks ? Math.max(0, o.bleed) : 0;
  const margin = o.margin ?? PRINT_MARGIN;
  // Neighbouring copies never print over each other's bleed.
  const spacing = Math.max(0, o.gap, 2 * bleed);
  const room = o.marks ? bleed + MARK_GAP + MIN_MARK_LENGTH : 0;
  const square = Math.abs(design.width - design.height) < EPS;
  let best: { sheet: Size; rotated: boolean; columns: number; rows: number } | undefined;
  for (const sheet of sheetOptions(o.paper, o.orientation, 'portrait')) {
    for (const rotated of square ? [false] : [false, true]) {
      const cellWidth = rotated ? design.height : design.width;
      const cellHeight = rotated ? design.width : design.height;
      const columns = fitCount(sheet.width - 2 * (margin + room), cellWidth, spacing);
      const rows = fitCount(sheet.height - 2 * (margin + room), cellHeight, spacing);
      const count = columns * rows;
      const bestCount = best ? best.columns * best.rows : -1;
      // The most copies wins; on a tie, copies that keep their orientation.
      if (count > bestCount || (count === bestCount && best?.rotated && !rotated))
        best = { sheet, rotated, columns, rows };
    }
  }
  if (!best || best.columns * best.rows === 0)
    return emptyPlan(
      orient(o.paper, o.orientation === 'landscape' ? 'landscape' : 'portrait'),
      design,
    );

  const { sheet, rotated, columns, rows } = best;
  const perSheet = columns * rows;
  const cellWidth = rotated ? design.height : design.width;
  const cellHeight = rotated ? design.width : design.height;
  const left = (sheet.width - (columns * cellWidth + (columns - 1) * spacing)) / 2;
  const top = (sheet.height - (rows * cellHeight + (rows - 1) * spacing)) / 2;
  const copies = Math.round(clamp(o.copies, 1, MAX_COPIES));
  const sheets: PrintSheet[] = [];
  let limited = o.copies > MAX_COPIES;
  pagesLoop: for (const pageIndex of pages) {
    for (let start = 0; start < copies; start += perSheet) {
      if (sheets.length >= MAX_SHEETS) {
        limited = true;
        break pagesLoop;
      }
      const placements: Placement[] = [];
      for (let i = 0; i < Math.min(perSheet, copies - start); i++) {
        const x = left + (i % columns) * (cellWidth + spacing);
        const y = top + Math.floor(i / columns) * (cellHeight + spacing);
        placements.push({
          pageIndex,
          x,
          y,
          scale: 1,
          rotated,
          clip: {
            x: x - bleed,
            y: y - bleed,
            width: cellWidth + 2 * bleed,
            height: cellHeight + 2 * bleed,
          },
        });
      }
      let marks: MarkLine[] = [];
      if (o.marks) {
        const xs = placements.flatMap((p) => [p.x, p.x + cellWidth]);
        const ys = placements.flatMap((p) => [p.y, p.y + cellHeight]);
        const x = Math.min(...xs);
        const y = Math.min(...ys);
        const block = { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
        marks = cutMarks(xs, ys, block, bleed + MARK_GAP, sheet);
      }
      sheets.push({ placements, marks });
    }
  }
  return {
    sheet,
    sheets,
    perSheet,
    scale: 1,
    rotated,
    bleed,
    fits: true,
    edgeToEdge: false,
    limited,
    grid: { columns, rows },
    printedSize: design,
  };
}

function tileCount(length: number, window: number, overlap: number): number {
  if (length <= window + EPS) return 1;
  return Math.ceil((length - overlap - EPS) / (window - overlap));
}

/** Tile names like A1, B3: a letter for the row, a number for the column. */
export function tileName(row: number, column: number): string {
  let letters = '';
  for (let n = row + 1; n > 0; n = Math.floor((n - 1) / 26))
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  return `${letters}${column + 1}`;
}

function planPoster(design: Size, pages: readonly number[], o: PrintOptions): PrintPlan {
  const scale = clamp(o.posterScale, 0.01, 100);
  const printed = { width: design.width * scale, height: design.height * scale };
  const margin = o.margin ?? POSTER_MARGIN;
  let best: { sheet: Size; area: Size; overlap: number; columns: number; rows: number } | undefined;
  for (const sheet of sheetOptions(o.paper, o.orientation, orientationOf(printed))) {
    const area = { width: sheet.width - 2 * margin, height: sheet.height - 2 * margin };
    if (area.width <= EPS || area.height <= EPS) continue;
    const overlap = clamp(o.overlap, 0, Math.min(area.width, area.height) / 2);
    const columns = tileCount(printed.width, area.width, overlap);
    const rows = tileCount(printed.height, area.height, overlap);
    if (!best || columns * rows < best.columns * best.rows)
      best = { sheet, area, overlap, columns, rows };
  }
  if (!best) return emptyPlan(o.paper, printed);

  const { sheet, area, overlap, columns, rows } = best;
  const sheets: PrintSheet[] = [];
  let limited = false;
  pagesLoop: for (const pageIndex of pages) {
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        if (sheets.length >= MAX_SHEETS) {
          limited = true;
          break pagesLoop;
        }
        const left = column * (area.width - overlap);
        const top = row * (area.height - overlap);
        const clip = {
          x: margin,
          y: margin,
          width: Math.min(area.width, printed.width - left),
          height: Math.min(area.height, printed.height - top),
        };
        let marks: MarkLine[] = [];
        if (o.marks) {
          const xs = [clip.x, clip.x + clip.width];
          const ys = [clip.y, clip.y + clip.height];
          // Ticks show where the next sheet's artwork starts, for lining up the overlap.
          if (overlap > EPS && column < columns - 1) xs.push(clip.x + clip.width - overlap);
          if (overlap > EPS && row < rows - 1) ys.push(clip.y + clip.height - overlap);
          marks = cutMarks(xs, ys, clip, MARK_GAP, sheet);
        }
        sheets.push({
          placements: [
            { pageIndex, x: margin - left, y: margin - top, scale, rotated: false, clip },
          ],
          marks,
          tile: { row, column },
        });
      }
    }
  }
  return {
    sheet,
    sheets,
    perSheet: columns * rows,
    scale,
    rotated: false,
    bleed: 0,
    fits: true,
    edgeToEdge: false,
    limited,
    grid: { columns, rows },
    printedSize: printed,
  };
}

/** Lays out the given design pages on sheets of paper. */
export function planPrint(
  design: Size,
  pages: readonly number[],
  options: PrintOptions,
): PrintPlan {
  if (options.layout === 'multiple') return planMultiple(design, pages, options);
  if (options.layout === 'poster') return planPoster(design, pages, options);
  return planSingle(design, pages, options);
}

/** Starting options for a design: what most people want when they press Print. */
export function suggestPrintLayout(
  design: Size,
  paper: Size,
): Pick<PrintOptions, 'layout' | 'fitToPaper' | 'marks'> {
  const sheet = orient(paper, orientationOf(design));
  const close = (a: number, b: number) => Math.abs(a - b) <= toPx(1, 'mm');
  if (close(design.width, sheet.width) && close(design.height, sheet.height))
    return { layout: 'single', fitToPaper: false, marks: false };
  const { perSheet } = planMultiple(design, [0], {
    layout: 'multiple',
    paper,
    orientation: 'auto',
    fitToPaper: false,
    copies: 1,
    gap: 0,
    posterScale: 1,
    overlap: 0,
    marks: true,
    bleed: 0,
  });
  if (perSheet >= 2) return { layout: 'multiple', fitToPaper: false, marks: true };
  if (perSheet === 1) return { layout: 'single', fitToPaper: false, marks: true };
  return { layout: 'single', fitToPaper: true, marks: false };
}
