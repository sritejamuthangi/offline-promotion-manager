import { describe, expect, it } from 'vitest';
import { codePointsOf, coversAny, inRanges, parseUnicodeRange } from './unicode';

describe('unicode ranges', () => {
  it('parses ranges, single code points and wildcards', () => {
    expect(parseUnicodeRange('U+0000-00FF, U+0131, U+4??')).toEqual([
      [0, 0xff],
      [0x131, 0x131],
      [0x400, 0x4ff],
    ]);
    expect(parseUnicodeRange('U+0-FF')).toEqual([[0, 0xff]]);
    expect(parseUnicodeRange('u+1f600-1f64f')).toEqual([[0x1f600, 0x1f64f]]);
    expect(parseUnicodeRange('')).toEqual([]);
    expect(parseUnicodeRange('U+ZZ, U+20-10')).toEqual([]);
  });

  it('checks whether a font subset is needed for some text', () => {
    const latin = parseUnicodeRange('U+0000-00FF');
    const cyrillic = parseUnicodeRange('U+0400-045F');
    const points = codePointsOf('Café');
    expect(coversAny(latin, points)).toBe(true);
    expect(coversAny(cyrillic, points)).toBe(false);
    expect(coversAny([], points)).toBe(true);
    expect(inRanges(0x400, cyrillic)).toBe(true);
    expect(inRanges(0x460, cyrillic)).toBe(false);
  });

  it('lists distinct code points, including characters outside the basic plane', () => {
    expect(codePointsOf('aba😀')).toEqual([0x61, 0x62, 0x1f600]);
    expect(codePointsOf('')).toEqual([]);
  });
});
