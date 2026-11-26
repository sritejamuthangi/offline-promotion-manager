import { describe, expect, it } from 'vitest';
import { CLASSIC_MAX_PER_ROW, classicRows, smartGridRows, uniformRows } from './balancedRows';

/**
 * The original algorithm from the first version of this project
 * (scripts/script.js, `groupCompaniesIntoRows`), kept verbatim as the reference.
 */
function legacyGroupCompaniesIntoRows(total: number): number[] {
  const rows: number[] = [];
  let remaining = total;

  while (remaining > 0) {
    if (remaining === 12) {
      rows.push(4, 4, 4);
      remaining -= 12;
    } else if (remaining === 11) {
      rows.push(4, 3, 4);
      remaining -= 11;
    } else if (remaining === 10) {
      rows.push(4, 2, 4);
      remaining -= 10;
    } else if (remaining === 9) {
      rows.push(3, 3, 3);
      remaining -= 9;
    } else if (remaining === 8) {
      rows.push(3, 2, 3);
      remaining -= 8;
    } else if (remaining === 7) {
      rows.push(2, 3, 2);
      remaining -= 7;
    } else if (remaining === 6) {
      rows.push(2, 2, 2);
      remaining -= 6;
    } else if (remaining === 5) {
      rows.push(2, 1, 2);
      remaining -= 5;
    } else if (remaining === 4) {
      rows.push(2, 2);
      remaining -= 4;
    } else if (remaining === 3) {
      rows.push(2, 1);
      remaining -= 3;
    } else if (remaining === 2) {
      rows.push(2);
      remaining -= 2;
    } else if (remaining === 1) {
      rows.push(1);
      remaining -= 1;
    } else {
      rows.push(4);
      remaining -= 4;
    }
  }

  return rows;
}

const sum = (rows: number[]) => rows.reduce((a, b) => a + b, 0);

describe('classicRows', () => {
  it('matches the original algorithm for 0 to 60 items', () => {
    for (let n = 0; n <= 60; n++) {
      expect(classicRows(n), `n = ${n}`).toEqual(legacyGroupCompaniesIntoRows(n));
    }
  });

  it('keeps the signature symmetric layouts', () => {
    expect(classicRows(5)).toEqual([2, 1, 2]);
    expect(classicRows(7)).toEqual([2, 3, 2]);
    expect(classicRows(8)).toEqual([3, 2, 3]);
    expect(classicRows(11)).toEqual([4, 3, 4]);
  });

  it('places every item exactly once and never exceeds the row limit', () => {
    for (let n = 1; n <= 200; n++) {
      const rows = classicRows(n);
      expect(sum(rows)).toBe(n);
      expect(Math.max(...rows)).toBeLessThanOrEqual(CLASSIC_MAX_PER_ROW);
    }
  });

  it('returns no rows for invalid totals', () => {
    expect(classicRows(0)).toEqual([]);
    expect(classicRows(-3)).toEqual([]);
    expect(classicRows(Number.NaN)).toEqual([]);
  });
});

describe('uniformRows', () => {
  it('fills rows and leaves the remainder in the last row', () => {
    expect(uniformRows(10, 4)).toEqual([4, 4, 2]);
    expect(uniformRows(9, 3)).toEqual([3, 3, 3]);
    expect(uniformRows(2, 5)).toEqual([2]);
  });

  it('handles empty and invalid input', () => {
    expect(uniformRows(0, 3)).toEqual([]);
    expect(uniformRows(5, 0)).toEqual([]);
  });
});

describe('smartGridRows', () => {
  it('uses balanced rows when no column count is chosen', () => {
    expect(smartGridRows(5)).toEqual([2, 1, 2]);
    expect(smartGridRows(8)).toEqual([3, 2, 3]);
  });

  it('uses a fixed column count when chosen', () => {
    expect(smartGridRows(10, 4)).toEqual([4, 4, 2]);
    expect(smartGridRows(3, 6)).toEqual([3]);
  });

  it('returns no rows for empty input', () => {
    expect(smartGridRows(0)).toEqual([]);
    expect(smartGridRows(0, 3)).toEqual([]);
  });
});
