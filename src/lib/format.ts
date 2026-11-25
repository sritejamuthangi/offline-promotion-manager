const RELATIVE_STEPS: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "now", "5 minutes ago", "yesterday", "in 2 days"... in the given locale. */
export function formatRelativeTime(timestamp: number, now: number, locale?: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const seconds = Math.round((timestamp - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return rtf.format(0, 'second');
  for (const [unit, size] of RELATIVE_STEPS) {
    if (abs >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(Math.sign(seconds), 'minute');
}

const BYTE_UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const;

/** "512 kB", "1.5 GB"... in the given locale. */
export function formatBytes(bytes: number, locale?: string): string {
  let value = Math.max(0, bytes);
  let index = 0;
  while (value >= 1000 && index < BYTE_UNITS.length - 1) {
    value /= 1000;
    index++;
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: BYTE_UNITS[index],
    unitDisplay: 'short',
    maximumFractionDigits: value < 10 && index > 0 ? 1 : 0,
  }).format(value);
}
