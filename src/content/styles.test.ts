import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/core/color';
import { getFont } from '@/core/fonts';
import { DEFAULT_THEME, HEX_COLOR_PATTERN, THEME_COLOR_KEYS } from '@/core/schema';
import en from '@/i18n/locales/en.json';
import { FONT_PAIRINGS, isPairing } from './fontPairings';
import { isPalette, PALETTES, paletteColors } from './palettes';

describe('palettes', () => {
  it('have unique IDs, every colour slot and translated names', () => {
    const ids = PALETTES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const palette of PALETTES) {
      for (const key of THEME_COLOR_KEYS) expect(palette.colors[key]).toMatch(HEX_COLOR_PATTERN);
      expect(en.styles.palettes[palette.id], palette.id).toBeTruthy();
    }
  });

  it.each(PALETTES)('$id keeps text readable', ({ colors: c }) => {
    expect(contrastRatio(c.text, c.background)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(c.text, c.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.muted, c.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.muted, c.surface)).toBeGreaterThanOrEqual(4.5);
    // Headings in the main colour, and page-coloured text on main-colour blocks.
    expect(contrastRatio(c.primary, c.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.primary, c.surface)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(c.secondary, c.background)).toBeGreaterThanOrEqual(3);
    // Decorations stay visible, and cards stay subtle.
    expect(contrastRatio(c.accent, c.background)).toBeGreaterThanOrEqual(1.5);
    expect(contrastRatio(c.surface, c.background)).toBeLessThanOrEqual(1.5);
  });

  it('includes the default theme, so new designs show a selected palette', () => {
    expect(PALETTES.some((palette) => isPalette(DEFAULT_THEME.colors, palette))).toBe(true);
  });

  it('copies colours instead of sharing them', () => {
    const colors = paletteColors('ocean');
    colors.primary = '#000000';
    expect(paletteColors('ocean').primary).not.toBe('#000000');
  });
});

describe('font pairings', () => {
  it('use bundled fonts and have translated names', () => {
    const ids = FONT_PAIRINGS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const pairing of FONT_PAIRINGS) {
      expect(getFont(pairing.heading)?.bundled, pairing.heading).toBe(true);
      expect(getFont(pairing.body)?.bundled, pairing.body).toBe(true);
      expect(en.styles.pairings[pairing.id], pairing.id).toBeTruthy();
    }
  });

  it('recognise the default theme fonts', () => {
    expect(FONT_PAIRINGS.some((pairing) => isPairing(DEFAULT_THEME.fonts, pairing))).toBe(true);
  });
});
