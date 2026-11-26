import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME } from '@/core/schema';
import { PALETTES } from '../palettes';
import {
  getLibraryGraphic,
  LIBRARY_CATEGORIES,
  LIBRARY_GRAPHICS,
  libraryIdFromSrc,
  librarySize,
  librarySrc,
  renderLibrarySvg,
} from './index';

/** A small XML check: balanced tags, quoted attributes and nothing outside elements. */
function expectWellFormed(svg: string) {
  const stack: string[] = [];
  const tag = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g;
  let last = 0;
  for (let match = tag.exec(svg); match; match = tag.exec(svg)) {
    expect(svg.slice(last, match.index).trim(), 'text between tags').toBe('');
    const [, closing, name = '', , selfClosing] = match;
    if (closing) expect(stack.pop()).toBe(name);
    else if (!selfClosing) stack.push(name);
    last = tag.lastIndex;
  }
  expect(svg.slice(last).trim(), 'trailing markup').toBe('');
  expect(stack).toEqual([]);
}

const FRAMES = [
  { width: 794, height: 1123 },
  { width: 1123, height: 794 },
  { width: 1080, height: 1920 },
  { width: 1080, height: 1080 },
];

describe('library graphics', () => {
  it('have unique IDs, known categories and a sensible natural size', () => {
    const ids = LIBRARY_GRAPHICS.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const graphic of LIBRARY_GRAPHICS) {
      expect(LIBRARY_CATEGORIES).toContain(graphic.category);
      expect(graphic.id).toMatch(/^[a-z0-9-]+$/);
      expect(graphic.width).toBeGreaterThan(0);
      expect(graphic.height).toBeGreaterThan(0);
    }
    for (const category of LIBRARY_CATEGORIES)
      expect(
        LIBRARY_GRAPHICS.some((g) => g.category === category),
        category,
      ).toBe(true);
  });

  it.each(LIBRARY_GRAPHICS.map((g) => [g.id, g] as const))(
    '%s renders well-formed SVG in every palette and frame',
    (_id, graphic) => {
      for (const palette of PALETTES) {
        for (const frame of graphic.adaptive ? FRAMES : [undefined]) {
          const svg = renderLibrarySvg(graphic, palette.colors, frame);
          expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" /);
          expect(svg).not.toMatch(/NaN|undefined|Infinity|null/);
          expectWellFormed(svg);
        }
      }
    },
  );

  it('draws in the design colours and is deterministic', () => {
    const graphic = getLibraryGraphic('confetti');
    if (!graphic) throw new Error('missing confetti');
    const svg = renderLibrarySvg(graphic, DEFAULT_THEME.colors, FRAMES[0]);
    expect(svg).toContain(DEFAULT_THEME.colors.primary);
    expect(svg).toContain(DEFAULT_THEME.colors.background);
    expect(renderLibrarySvg(graphic, DEFAULT_THEME.colors, FRAMES[0])).toBe(svg);
  });

  it('redraws adaptive graphics for the frame proportions', () => {
    const dots = getLibraryGraphic('dots');
    const balloons = getLibraryGraphic('balloons');
    if (!dots || !balloons) throw new Error('missing graphics');
    expect(librarySize(dots, { width: 794, height: 1123 })).toEqual({ width: 707, height: 1000 });
    expect(librarySize(dots, { width: 2000, height: 1000 })).toEqual({ width: 1000, height: 500 });
    expect(librarySize(dots)).toEqual({ width: 1000, height: 1000 });
    expect(librarySize(balloons, { width: 10, height: 10 })).toEqual({ width: 600, height: 800 });
  });

  it('round-trips library references', () => {
    expect(libraryIdFromSrc(librarySrc('dots'))).toBe('dots');
    expect(libraryIdFromSrc('asset:123')).toBeUndefined();
    expect(libraryIdFromSrc(undefined)).toBeUndefined();
  });
});
