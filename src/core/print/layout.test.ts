import { describe, expect, it } from 'vitest';
import { createDesign } from '../design/factory';
import type { DesignElement, ImageElement, ShapeElement, TextElement } from '../schema';
import { toPx } from '../units';
import { withBleed } from './bleed';
import {
  designSheet,
  MARK_GAP,
  MARK_LENGTH,
  MAX_SHEETS,
  type PrintOptions,
  planPrint,
  suggestPrintLayout,
  tileName,
} from './layout';

const mm = (value: number) => toPx(value, 'mm');
const size = (width: number, height: number) => ({ width: mm(width), height: mm(height) });
const A4 = size(210, 297);
const A3 = size(297, 420);
const CARD = size(85, 55);

function options(overrides: Partial<PrintOptions> = {}): PrintOptions {
  return {
    layout: 'single',
    paper: A4,
    orientation: 'auto',
    fitToPaper: false,
    copies: 1,
    gap: 0,
    posterScale: 1,
    overlap: 0,
    marks: false,
    bleed: 0,
    ...overrides,
  };
}

describe('one design per sheet', () => {
  it('prints an A4 design on A4 paper at actual size, one sheet per page', () => {
    const plan = planPrint(A4, [0, 1], options());
    expect(plan.sheet).toEqual(A4);
    expect(plan.sheets).toHaveLength(2);
    expect(plan.sheets[1]?.placements).toEqual([
      { pageIndex: 1, x: 0, y: 0, scale: 1, rotated: false, clip: { x: 0, y: 0, ...A4 } },
    ]);
    expect(plan.fits).toBe(true);
    expect(plan.edgeToEdge).toBe(true);
    expect(plan.sheets[0]?.marks).toEqual([]);
  });

  it('turns the paper to match a landscape design', () => {
    const plan = planPrint(size(297, 210), [0], options());
    expect(plan.sheet).toEqual(size(297, 210));
    expect(plan.fits).toBe(true);
  });

  it('scales a large design down to fit inside the printer-safe margins', () => {
    const plan = planPrint(A3, [0], options({ fitToPaper: true }));
    expect(plan.sheet).toEqual(A4);
    expect(plan.scale).toBeCloseTo(200 / 297, 6);
    const placement = plan.sheets[0]?.placements[0];
    expect(placement?.x).toBeCloseTo(mm(5), 6);
    expect(plan.edgeToEdge).toBe(false);
    expect(plan.printedSize.width).toBeCloseTo(mm(200), 6);
  });

  it('reports when an actual-size design is larger than the paper', () => {
    expect(planPrint(A3, [0], options()).fits).toBe(false);
  });

  it('fits very long banners without imposing a minimum print scale', () => {
    const plan = planPrint(
      { width: 100_000, height: 1000 },
      [0],
      options({ fitToPaper: true, orientation: 'portrait' }),
    );
    expect(plan.fits).toBe(true);
    expect(plan.printedSize.width).toBeLessThanOrEqual(plan.sheet.width - mm(10) + 0.01);
    expect(plan.scale).toBeLessThan(0.01);
  });

  it('draws eight crop marks clear of the trim around a centred design', () => {
    const plan = planPrint(size(148, 210), [0], options({ marks: true }));
    const marks = plan.sheets[0]?.marks ?? [];
    expect(marks).toHaveLength(8);
    const placement = plan.sheets[0]?.placements[0];
    const top = placement?.y ?? 0;
    const vertical = marks.filter((m) => m.x1 === m.x2 && m.y2 <= top);
    expect(vertical).toHaveLength(2);
    for (const mark of vertical) {
      expect(mark.y2).toBeCloseTo(top - MARK_GAP, 6);
      expect(mark.y2 - mark.y1).toBeCloseTo(MARK_LENGTH, 6);
    }
  });

  it('keeps crop marks outside the bleed and fits a design-size sheet exactly', () => {
    const bleed = mm(3);
    const sheet = designSheet(A4, true, bleed);
    expect(sheet.width).toBeCloseTo(A4.width + 2 * (bleed + MARK_GAP + MARK_LENGTH), 6);
    const plan = planPrint(A4, [0], options({ paper: sheet, marks: true, bleed }));
    expect(plan.fits).toBe(true);
    const placement = plan.sheets[0]?.placements[0];
    expect(placement?.clip.width).toBeCloseTo(A4.width + 2 * bleed, 6);
    expect(placement?.clip.x).toBeCloseTo(MARK_GAP + MARK_LENGTH, 6);
    for (const mark of plan.sheets[0]?.marks ?? []) {
      const length = Math.hypot(mark.x2 - mark.x1, mark.y2 - mark.y1);
      expect(length).toBeCloseTo(MARK_LENGTH, 6);
    }
  });
});

describe('several per sheet', () => {
  it('fits ten business cards on A4 and spreads copies over sheets', () => {
    const plan = planPrint(CARD, [0], options({ layout: 'multiple', copies: 25, marks: true }));
    expect(plan.perSheet).toBe(10);
    expect(plan.rotated).toBe(false);
    expect(plan.sheet).toEqual(A4);
    expect(plan.sheets.map((sheet) => sheet.placements.length)).toEqual([10, 10, 5]);
    // Shared cut lines: 3 vertical and 6 horizontal cuts, each marked on both sides.
    expect(plan.sheets[0]?.marks).toHaveLength(18);
    const first = plan.sheets[0]?.placements[0];
    const last = plan.sheets[0]?.placements[9];
    // The block of cards is centred on the sheet.
    expect((first?.x ?? 0) + (last?.x ?? 0) + CARD.width).toBeCloseTo(A4.width, 6);
    expect((first?.y ?? 0) + (last?.y ?? 0) + CARD.height).toBeCloseTo(A4.height, 6);
  });

  it('fits US business cards on US Letter, turning the paper when that fits more', () => {
    const card = { width: toPx(3.5, 'in'), height: toPx(2, 'in') };
    const letter = { width: toPx(8.5, 'in'), height: toPx(11, 'in') };
    const plain = planPrint(card, [0], options({ layout: 'multiple', paper: letter }));
    expect([plain.perSheet, plain.rotated]).toEqual([12, false]);
    expect(plain.sheet.width).toBeCloseTo(toPx(11, 'in'), 6);
    const marked = planPrint(
      card,
      [0],
      options({ layout: 'multiple', paper: letter, marks: true }),
    );
    expect([marked.perSheet, marked.rotated]).toEqual([10, false]);
  });

  it('separates copies by twice the bleed and prefers copies the right way up', () => {
    const bleed = mm(3);
    const plan = planPrint(
      CARD,
      [0],
      options({ layout: 'multiple', copies: 9, marks: true, bleed }),
    );
    expect(plan.perSheet).toBe(9);
    expect(plan.rotated).toBe(false);
    expect(plan.sheet).toEqual(size(297, 210));
    const [a, b] = plan.sheets[0]?.placements ?? [];
    expect((b?.x ?? 0) - (a?.x ?? 0)).toBeCloseTo(CARD.width + 2 * bleed, 6);
    expect(a?.clip.width).toBeCloseTo(CARD.width + 2 * bleed, 6);
  });

  it('turns copies a quarter turn when more of them fit', () => {
    const plan = planPrint(
      size(140, 95),
      [0],
      options({ layout: 'multiple', orientation: 'portrait', margin: 0 }),
    );
    expect(plan.perSheet).toBe(4);
    expect(plan.rotated).toBe(true);
    expect(plan.sheets[0]?.placements[0]?.clip.width).toBeCloseTo(mm(95), 6);
    expect(plan.sheets[0]?.placements[0]?.clip.height).toBeCloseTo(mm(140), 6);
  });

  it('fills a sheet exactly with four A6 postcards when the border is off', () => {
    const plan = planPrint(size(148, 105), [0], options({ layout: 'multiple', margin: 0 }));
    expect(plan.perSheet).toBe(4);
  });

  it('prints every page’s copies on their own sheets', () => {
    const plan = planPrint(CARD, [0, 1], options({ layout: 'multiple', copies: 10 }));
    expect(plan.sheets.map((sheet) => sheet.placements[0]?.pageIndex)).toEqual([0, 1]);
  });

  it('reports when not even one copy fits', () => {
    const plan = planPrint(A3, [0], options({ layout: 'multiple' }));
    expect(plan.fits).toBe(false);
    expect(plan.sheets).toEqual([]);
  });

  it('flags a request that exceeds the copy limit instead of silently losing copies', () => {
    const plan = planPrint(size(1, 1), [0], options({ layout: 'multiple', copies: 1001 }));
    expect(plan.limited).toBe(true);
    expect(plan.sheets[0]?.placements).toHaveLength(1000);
  });
});

describe('posters across several sheets', () => {
  it('tiles an A3 poster onto four A4 sheets with overlap and cut marks', () => {
    const plan = planPrint(A3, [0], options({ layout: 'poster', overlap: mm(10), marks: true }));
    expect(plan.grid).toEqual({ columns: 2, rows: 2 });
    expect(plan.sheet).toEqual(A4);
    expect(plan.sheets).toHaveLength(4);
    const [a1, a2, b1, b2] = plan.sheets;
    expect(a1?.tile).toEqual({ row: 0, column: 0 });
    expect(a1?.placements[0]?.clip.width).toBeCloseTo(mm(190), 6);
    expect(a2?.placements[0]?.clip.width).toBeCloseTo(mm(297 - 180), 6);
    expect(b1?.placements[0]?.clip.height).toBeCloseTo(mm(420 - 267), 6);
    expect(b2?.placements[0]?.x).toBeCloseTo(mm(10 - 180), 6);
    expect(b2?.placements[0]?.y).toBeCloseTo(mm(10 - 267), 6);
    // Corner marks plus overlap ticks where a neighbour continues.
    expect(a1?.marks).toHaveLength(12);
    expect(b2?.marks).toHaveLength(8);
  });

  it('enlarges the design and picks the paper orientation that needs fewer sheets', () => {
    const plan = planPrint(A4, [0], options({ layout: 'poster', posterScale: 2 }));
    expect(plan.printedSize.width).toBeCloseTo(mm(420), 6);
    expect(plan.perSheet).toBe(plan.grid.columns * plan.grid.rows);
    const other = planPrint(
      A4,
      [0],
      options({ layout: 'poster', posterScale: 2, orientation: 'landscape' }),
    );
    expect(plan.perSheet).toBeLessThanOrEqual(other.perSheet);
  });

  it('stops at a safe number of sheets', () => {
    const plan = planPrint({ width: 100_000, height: 100_000 }, [0], options({ layout: 'poster' }));
    expect(plan.sheets).toHaveLength(MAX_SHEETS);
    expect(plan.limited).toBe(true);
  });

  it('names tiles with a row letter and a column number', () => {
    expect(tileName(0, 0)).toBe('A1');
    expect(tileName(1, 2)).toBe('B3');
    expect(tileName(25, 0)).toBe('Z1');
    expect(tileName(26, 4)).toBe('AA5');
  });
});

describe('suggested layout', () => {
  it('matches common designs to what people usually want', () => {
    expect(suggestPrintLayout(A4, A4)).toEqual({
      layout: 'single',
      fitToPaper: false,
      marks: false,
    });
    expect(suggestPrintLayout(size(297, 210), A4).layout).toBe('single');
    expect(suggestPrintLayout(CARD, A4)).toEqual({
      layout: 'multiple',
      fitToPaper: false,
      marks: true,
    });
    expect(suggestPrintLayout(size(148, 210), A4)).toEqual({
      layout: 'single',
      fitToPaper: false,
      marks: true,
    });
    expect(suggestPrintLayout(A3, A4)).toEqual({
      layout: 'single',
      fitToPaper: true,
      marks: false,
    });
    expect(suggestPrintLayout({ width: 1080, height: 1080 }, A4).fitToPaper).toBe(true);
  });
});

describe('bleed', () => {
  const W = 400;
  const H = 300;
  const b = 12;
  const base = createDesign({ name: 'Bleed', width: W, height: H, unit: 'px', now: 0 });
  const rect = (x: number, y: number, width: number, height: number): ShapeElement => ({
    id: `r${x}${y}`,
    type: 'shape',
    shape: 'rect',
    x,
    y,
    width,
    height,
    rotation: 0,
    opacity: 1,
    fill: { type: 'solid', color: '$primary' },
  });
  const bled = (element: DesignElement) => {
    const design = { ...base, pages: [{ ...base.pages[0], elements: [element] }] };
    return withBleed(design as typeof base, b).pages[0]?.elements[0];
  };

  it('grows the page and leaves the design unchanged without bleed', () => {
    expect(withBleed(base, 0)).toBe(base);
    const design = withBleed(base, b);
    expect([design.width, design.height]).toEqual([W + 2 * b, H + 2 * b]);
    expect(base.width).toBe(W);
  });

  it('runs edge-to-edge colour blocks and photos into the bleed', () => {
    expect(bled(rect(0, 0, W, 100))).toMatchObject({
      x: 0,
      y: 0,
      width: W + 2 * b,
      height: 100 + b,
    });
    const photo: ImageElement = {
      ...rect(0, H - 50, 80, 50),
      type: 'image',
      src: 'library:dots',
      fit: 'cover',
    } as unknown as ImageElement;
    expect(bled(photo)).toMatchObject({ x: 0, y: H - 50 + b, width: 80 + b, height: 50 + b });
  });

  it('only moves text, outlines, turned shapes and inner artwork', () => {
    const text = { ...rect(0, 0, W, 40), type: 'text' } as unknown as TextElement;
    expect(bled(text)).toMatchObject({ x: b, y: b, width: W, height: 40 });
    const outline = { ...rect(0, 0, W, H), stroke: { color: '$text', width: 2 } };
    expect(bled(outline)).toMatchObject({ x: b, y: b, width: W, height: H });
    expect(bled({ ...rect(0, 0, W, 40), rotation: 90 })).toMatchObject({ x: b, width: W });
    expect(bled({ ...rect(0, 0, W, 40), rotation: 180 })).toMatchObject({ x: b, width: W });
    expect(bled(rect(20, 20, 50, 50))).toMatchObject({ x: 20 + b, y: 20 + b, width: 50 });
    // Already past the bleed edge: nothing to extend.
    expect(bled(rect(-30, 10, 100, 50))).toMatchObject({ x: -30 + b, width: 100 });
  });
});
