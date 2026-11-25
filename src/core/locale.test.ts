import { describe, expect, it } from 'vitest';
import { defaultPaperFor, defaultUnitFor, regionOf } from './locale';

describe('locale defaults', () => {
  it('reads or infers the region', () => {
    expect(regionOf('en-IN')).toBe('IN');
    expect(regionOf('te')).toBe('IN');
    expect(regionOf('ja')).toBe('JP');
    expect(regionOf(undefined)).toBeUndefined();
    expect(regionOf('not a locale!')).toBeUndefined();
  });

  it('uses US Letter and inches in the Americas regions that use them', () => {
    for (const locale of ['en-US', 'en-CA', 'es-MX', 'fil-PH', 'es-CO']) {
      expect(defaultPaperFor(locale), locale).toBe('letter');
      expect(defaultUnitFor(locale), locale).toBe('in');
    }
  });

  it('uses A4 and millimetres everywhere else', () => {
    for (const locale of ['en-GB', 'en-IN', 'hi', 'te', 'de-DE', 'pt-BR', 'ar-EG', 'zh-CN']) {
      expect(defaultPaperFor(locale), locale).toBe('a4');
      expect(defaultUnitFor(locale), locale).toBe('mm');
    }
    expect(defaultPaperFor(undefined)).toBe('a4');
  });
});
