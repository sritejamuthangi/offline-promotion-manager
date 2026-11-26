import { describe, expect, it } from 'vitest';
import { STICKER_NAMES } from './schema';
import { stickerPath } from './stickers';

describe('stickerPath', () => {
  it('returns a closed SVG path for every sticker', () => {
    for (const name of STICKER_NAMES) {
      const path = stickerPath(name);
      expect(path, name).toMatch(/^M/);
      expect(path, name).toContain('Z');
      expect(path, name).not.toContain('NaN');
    }
  });

  it('keeps every sticker distinct', () => {
    const paths = new Set(STICKER_NAMES.map((name) => stickerPath(name)));
    expect(paths.size).toBe(STICKER_NAMES.length);
  });
});
