import type { Unit } from './units';

/**
 * Regions that use US Letter paper (and usually inches) instead of ISO A4.
 * Everywhere else defaults to A4 and millimetres.
 */
const LETTER_REGIONS: ReadonlySet<string> = new Set([
  'US',
  'CA',
  'MX',
  'PH',
  'CL',
  'CO',
  'VE',
  'CR',
  'GT',
  'PA',
  'DO',
  'PR',
  'SV',
  'NI',
  'HN',
  'BZ',
]);

export type PaperFamily = 'a4' | 'letter';

/** Region of a BCP 47 locale, inferring the likely region when it is missing ("hi" -> "IN"). */
export function regionOf(locale: string | undefined): string | undefined {
  if (!locale) return undefined;
  try {
    return new Intl.Locale(locale).maximize().region;
  } catch {
    return undefined;
  }
}

export function defaultPaperFor(locale: string | undefined): PaperFamily {
  const region = regionOf(locale);
  return region !== undefined && LETTER_REGIONS.has(region) ? 'letter' : 'a4';
}

export function defaultUnitFor(locale: string | undefined): Unit {
  return defaultPaperFor(locale) === 'letter' ? 'in' : 'mm';
}

/** The browser's preferred locale, or undefined outside a browser. */
export function browserLocale(): string | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.language;
}
