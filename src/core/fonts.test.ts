import { describe, expect, it } from 'vitest';
import imports from '../styles/fonts.ts?raw';
import { FONTS, fontStack, getFont } from './fonts';

describe('fontStack', () => {
  it('prefers the bundled variable font, then the plain name, then a generic family', () => {
    expect(fontStack('Montserrat')).toBe('"Montserrat Variable", "Montserrat", sans-serif');
    expect(fontStack('Playfair Display')).toBe(
      '"Playfair Display Variable", "Playfair Display", serif',
    );
    expect(fontStack('Pacifico')).toBe('"Pacifico", cursive');
  });

  it('keeps unknown and device fonts, quoted safely', () => {
    expect(fontStack('Georgia')).toBe('"Georgia", serif');
    expect(fontStack('My "Fancy" Font')).toBe('"My \\"Fancy\\" Font", sans-serif');
  });

  it('finds fonts case-insensitively', () => {
    expect(getFont('bebas neue')?.family).toBe('Bebas Neue');
    expect(getFont('Comic Sans')).toBeUndefined();
  });
});

describe('bundled fonts', () => {
  it('are all imported, so they work offline', () => {
    for (const font of FONTS.filter((f) => f.bundled)) {
      const slug = font.family.toLowerCase().replace(/\s+/g, '-');
      const pkg = font.variable ? `@fontsource-variable/${slug}` : `@fontsource/${slug}`;
      expect(imports, font.family).toContain(`'${pkg}'`);
    }
  });

  it('have unique names and sensible weights', () => {
    const names = FONTS.map((f) => f.family.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    for (const font of FONTS) {
      expect(font.weights[0]).toBeLessThanOrEqual(font.weights[1]);
      expect(font.weights[0]).toBeGreaterThanOrEqual(100);
      expect(font.weights[1]).toBeLessThanOrEqual(1000);
    }
  });
});
