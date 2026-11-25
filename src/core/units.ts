/**
 * Length units. All design geometry is stored in CSS pixels, where 1 px is exactly
 * 1/96 of an inch. Browsers print CSS pixels at that physical size, so a design stored
 * in px prints at its true size on any printer.
 */
export const UNITS = ['mm', 'cm', 'in', 'pt', 'px'] as const;
export type Unit = (typeof UNITS)[number];

export const PX_PER_INCH = 96;
export const MM_PER_INCH = 25.4;

const PX_PER_UNIT: Readonly<Record<Unit, number>> = {
  px: 1,
  in: PX_PER_INCH,
  pt: PX_PER_INCH / 72,
  mm: PX_PER_INCH / MM_PER_INCH,
  cm: (PX_PER_INCH / MM_PER_INCH) * 10,
};

/** How many decimals to show for each unit in the UI. */
export const UNIT_DECIMALS: Readonly<Record<Unit, number>> = {
  px: 0,
  pt: 1,
  mm: 1,
  cm: 2,
  in: 2,
};

export function isUnit(value: unknown): value is Unit {
  return typeof value === 'string' && (UNITS as readonly string[]).includes(value);
}

export function toPx(value: number, unit: Unit): number {
  return value * PX_PER_UNIT[unit];
}

export function fromPx(px: number, unit: Unit): number {
  return px / PX_PER_UNIT[unit];
}

export function convertLength(value: number, from: Unit, to: Unit): number {
  return from === to ? value : fromPx(toPx(value, from), to);
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function numberFormat(unit: Unit, locale?: string): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: UNIT_DECIMALS[unit] });
}

/** Formats a px length in the given unit, e.g. `210 mm`. */
export function formatLength(px: number, unit: Unit, locale?: string): string {
  const value = roundTo(fromPx(px, unit), UNIT_DECIMALS[unit]);
  return `${numberFormat(unit, locale).format(value)} ${unit}`;
}

/** Formats a width × height size in the given unit, e.g. `210 × 297 mm`. */
export function formatSize(widthPx: number, heightPx: number, unit: Unit, locale?: string): string {
  const nf = numberFormat(unit, locale);
  const w = roundTo(fromPx(widthPx, unit), UNIT_DECIMALS[unit]);
  const h = roundTo(fromPx(heightPx, unit), UNIT_DECIMALS[unit]);
  return `${nf.format(w)} × ${nf.format(h)} ${unit}`;
}

/** Number of image pixels a px length covers when exported or printed at `dpi`. */
export function pxAtDpi(px: number, dpi: number): number {
  return Math.round((px / PX_PER_INCH) * dpi);
}
