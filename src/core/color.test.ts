import { describe, expect, it } from 'vitest';
import { contrastRatio, readableOn, relativeLuminance } from './color';

describe('colour contrast', () => {
  it('matches the WCAG reference values', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });

  it('ignores an alpha channel', () => {
    expect(contrastRatio('#00000080', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('picks black or white text for any background', () => {
    expect(readableOn('#ffffff')).toBe('#000000');
    expect(readableOn('#111827')).toBe('#ffffff');
    expect(readableOn('#fbbf24')).toBe('#000000');
  });
});
