import type { Theme } from '@/core/schema';

/**
 * One-click heading and body font combinations, all using bundled fonts so they look the
 * same everywhere. Names are translated under `styles.pairings.<id>`.
 */
export const FONT_PAIRINGS = [
  { id: 'simple', heading: 'Inter', body: 'Inter' },
  { id: 'modern', heading: 'Montserrat', body: 'Inter' },
  { id: 'clean', heading: 'Outfit', body: 'Outfit' },
  { id: 'friendly', heading: 'Nunito', body: 'Nunito' },
  { id: 'tech', heading: 'Space Grotesk', body: 'Inter' },
  { id: 'elegant', heading: 'Playfair Display', body: 'Lora' },
  { id: 'editorial', heading: 'Merriweather', body: 'Inter' },
  { id: 'headline', heading: 'Oswald', body: 'Inter' },
  { id: 'poster', heading: 'Bebas Neue', body: 'Montserrat' },
  { id: 'heavy', heading: 'Archivo Black', body: 'Inter' },
  { id: 'playful', heading: 'Pacifico', body: 'Nunito' },
  { id: 'graceful', heading: 'Dancing Script', body: 'Montserrat' },
  { id: 'formal', heading: 'Great Vibes', body: 'Playfair Display' },
  { id: 'casual', heading: 'Caveat', body: 'Nunito' },
] as const satisfies readonly ({ id: string } & Theme['fonts'])[];

export type FontPairingId = (typeof FONT_PAIRINGS)[number]['id'];
export type FontPairing = (typeof FONT_PAIRINGS)[number];

export function getFontPairing(id: FontPairingId): FontPairing {
  return FONT_PAIRINGS.find((pairing) => pairing.id === id) ?? FONT_PAIRINGS[0];
}

export function pairingFonts(id: FontPairingId): Theme['fonts'] {
  const { heading, body } = getFontPairing(id);
  return { heading, body };
}

export function isPairing(fonts: Theme['fonts'], pairing: FontPairing): boolean {
  return fonts.heading === pairing.heading && fonts.body === pairing.body;
}
