/**
 * Row patterns from the original "Upcoming Drives" app (`groupCompaniesIntoRows`).
 * Symmetric patterns make small sets of cards look intentional on a poster:
 * 5 -> 2·1·2, 7 -> 2·3·2, 8 -> 3·2·3, 11 -> 4·3·4.
 */
const CLASSIC_PATTERNS: Readonly<Record<number, readonly number[]>> = {
  1: [1],
  2: [2],
  3: [2, 1],
  4: [2, 2],
  5: [2, 1, 2],
  6: [2, 2, 2],
  7: [2, 3, 2],
  8: [3, 2, 3],
  9: [3, 3, 3],
  10: [4, 2, 4],
  11: [4, 3, 4],
  12: [4, 4, 4],
};

/** The widest row the classic layout produces. */
export const CLASSIC_MAX_PER_ROW = 4;

/**
 * Splits `total` items into rows using the classic patterns. Above 12 items, full rows of
 * four come first until 12 or fewer remain, exactly like the original app.
 */
export function classicRows(total: number): number[] {
  const rows: number[] = [];
  if (!Number.isFinite(total)) return rows;
  let remaining = Math.floor(total);
  while (remaining > 0) {
    const pattern = CLASSIC_PATTERNS[remaining];
    if (pattern) {
      rows.push(...pattern);
      break;
    }
    rows.push(CLASSIC_MAX_PER_ROW);
    remaining -= CLASSIC_MAX_PER_ROW;
  }
  return rows;
}

/** Fills rows left to right with `perRow` items each; the last row holds what is left. */
export function uniformRows(total: number, perRow: number): number[] {
  const rows: number[] = [];
  if (!Number.isFinite(total) || !Number.isFinite(perRow) || perRow < 1) return rows;
  const size = Math.floor(perRow);
  let remaining = Math.floor(total);
  while (remaining > 0) {
    const count = Math.min(size, remaining);
    rows.push(count);
    remaining -= count;
  }
  return rows;
}

/** Row sizes for the Smart Grid: classic balanced rows unless a fixed column count is chosen. */
export function smartGridRows(total: number, columns?: number): number[] {
  return columns ? uniformRows(total, columns) : classicRows(total);
}
