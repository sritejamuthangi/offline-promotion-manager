import { describe, expect, it } from 'vitest';
import { newId, timestampOfUuidv7, UUID_V7_PATTERN, uuidv7 } from './ids';

describe('uuidv7', () => {
  it('reproduces the RFC 9562 example', () => {
    // RFC 9562 appendix A.6: 017F22E2-79B0-7CC3-98C4-DC0C0C07398F
    const random = Uint8Array.from([0x0c, 0xc3, 0x18, 0xc4, 0xdc, 0x0c, 0x0c, 0x07, 0x39, 0x8f]);
    expect(uuidv7(0x017f22e279b0, random)).toBe('017f22e2-79b0-7cc3-98c4-dc0c0c07398f');
  });

  it('produces valid, unique v7 IDs', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId()));
    expect(ids.size).toBe(1000);
    for (const id of ids) expect(id).toMatch(UUID_V7_PATTERN);
  });

  it('stores the creation time and sorts by it', () => {
    const early = uuidv7(1_700_000_000_000);
    const late = uuidv7(1_800_000_000_000);
    expect(timestampOfUuidv7(early)).toBe(1_700_000_000_000);
    expect([late, early].sort()).toEqual([early, late]);
  });

  it('rejects impossible timestamps', () => {
    expect(() => uuidv7(-1)).toThrow(RangeError);
    expect(() => uuidv7(1.5)).toThrow(RangeError);
  });
});
