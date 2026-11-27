export type CodeRange = readonly [start: number, end: number];

/** Parses a CSS `unicode-range` such as `U+0000-00FF, U+0131, U+4??`. */
export function parseUnicodeRange(value: string): CodeRange[] {
  const ranges: CodeRange[] = [];
  for (const part of value.split(',')) {
    const token = part.trim().toUpperCase().replace(/^U\+/, '');
    if (!token) continue;
    let start: number;
    let end: number;
    if (token.includes('?')) {
      start = Number.parseInt(token.replaceAll('?', '0'), 16);
      end = Number.parseInt(token.replaceAll('?', 'F'), 16);
    } else {
      const [from = '', to] = token.split('-');
      start = Number.parseInt(from, 16);
      end = to === undefined ? start : Number.parseInt(to, 16);
    }
    if (Number.isFinite(start) && Number.isFinite(end) && start <= end) ranges.push([start, end]);
  }
  return ranges;
}

/** True when any code point falls in the ranges. A font without ranges covers everything. */
export function coversAny(ranges: readonly CodeRange[], codePoints: Iterable<number>): boolean {
  if (!ranges.length) return true;
  for (const point of codePoints)
    for (const [start, end] of ranges) if (point >= start && point <= end) return true;
  return false;
}
