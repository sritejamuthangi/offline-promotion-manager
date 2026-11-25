import { describe, expect, it } from 'vitest';
import {
  convertLength,
  formatLength,
  formatSize,
  fromPx,
  isUnit,
  pxAtDpi,
  roundTo,
  toPx,
} from './units';

describe('units', () => {
  it('uses the CSS reference pixel (96 per inch)', () => {
    expect(toPx(1, 'in')).toBe(96);
    expect(toPx(72, 'pt')).toBe(96);
    expect(toPx(25.4, 'mm')).toBeCloseTo(96, 10);
    expect(toPx(2.54, 'cm')).toBeCloseTo(96, 10);
    expect(toPx(10, 'px')).toBe(10);
  });

  it('round-trips through px without drift', () => {
    expect(fromPx(toPx(210, 'mm'), 'mm')).toBeCloseTo(210, 10);
    expect(fromPx(toPx(8.5, 'in'), 'in')).toBeCloseTo(8.5, 10);
  });

  it('converts between units', () => {
    expect(convertLength(1, 'in', 'cm')).toBeCloseTo(2.54, 10);
    expect(convertLength(297, 'mm', 'in')).toBeCloseTo(11.6929, 4);
    expect(convertLength(5, 'mm', 'mm')).toBe(5);
  });

  it('formats lengths and sizes for display', () => {
    expect(formatLength(toPx(210, 'mm'), 'mm', 'en')).toBe('210 mm');
    expect(formatSize(toPx(210, 'mm'), toPx(297, 'mm'), 'mm', 'en')).toBe('210 × 297 mm');
    expect(formatSize(toPx(8.5, 'in'), toPx(11, 'in'), 'in', 'en')).toBe('8.5 × 11 in');
    expect(formatSize(1080, 1920, 'px', 'en')).toBe('1,080 × 1,920 px');
    expect(formatLength(toPx(85.6, 'mm'), 'mm', 'de')).toBe('85,6 mm');
  });

  it('computes image pixels at a given DPI', () => {
    expect(pxAtDpi(toPx(8.5, 'in'), 300)).toBe(2550);
    expect(pxAtDpi(toPx(210, 'mm'), 300)).toBe(2480);
  });

  it('rounds and validates', () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(isUnit('mm')).toBe(true);
    expect(isUnit('furlong')).toBe(false);
  });
});
