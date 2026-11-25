import { describe, expect, it } from 'vitest';
import {
  findPresetBySize,
  getPreset,
  orientationOf,
  PRESET_CATEGORIES,
  presetSizePx,
  presetsInCategory,
  SIZE_PRESETS,
  withOrientation,
} from './paper';
import { toPx } from './units';

describe('size presets', () => {
  it('have unique IDs, known categories and positive sizes', () => {
    const ids = SIZE_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of SIZE_PRESETS) {
      expect(PRESET_CATEGORIES).toContain(p.category);
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
    }
    for (const category of PRESET_CATEGORIES) {
      expect(presetsInCategory(category).length).toBeGreaterThan(0);
    }
  });

  it('use the standard dimensions', () => {
    const a4 = presetSizePx(getPreset('a4') ?? SIZE_PRESETS[0]);
    expect(a4.width).toBeCloseTo(toPx(210, 'mm'), 10);
    expect(a4.height).toBeCloseTo(toPx(297, 'mm'), 10);
    const letter = presetSizePx(getPreset('letter') ?? SIZE_PRESETS[0]);
    expect(letter).toEqual({ width: 816, height: 1056 });
  });

  it('finds presets by size in either orientation', () => {
    expect(findPresetBySize(toPx(297, 'mm'), toPx(210, 'mm'))?.id).toBe('a4');
    expect(findPresetBySize(816, 1056)?.id).toBe('letter');
    expect(findPresetBySize(123, 456)).toBeUndefined();
  });

  it('rotates sizes to the requested orientation', () => {
    expect(orientationOf(100, 200)).toBe('portrait');
    expect(orientationOf(200, 100)).toBe('landscape');
    expect(orientationOf(100, 100)).toBe('square');
    expect(withOrientation({ width: 100, height: 200 }, 'landscape')).toEqual({
      width: 200,
      height: 100,
    });
    expect(withOrientation({ width: 100, height: 100 }, 'landscape')).toEqual({
      width: 100,
      height: 100,
    });
  });
});
