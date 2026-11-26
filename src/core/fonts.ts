/**
 * Fonts people can pick. Bundled fonts ship with the app (SIL Open Font License), so designs
 * look the same on every device, offline and in print. Device fonts depend on what is
 * installed and may fall back to a similar font, especially on phones.
 *
 * Adding a bundled font: install its `@fontsource` package, import it in
 * `src/styles/fonts.ts` and list it here. A unit test checks both stay in sync.
 */
export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';

export interface FontDefinition {
  /** The name stored in designs. */
  readonly family: string;
  readonly category: FontCategory;
  readonly bundled: boolean;
  /** Bundled variable fonts register as "<family> Variable" (Fontsource convention). */
  readonly variable?: boolean;
  /** Lightest and heaviest weight the font provides. */
  readonly weights: readonly [number, number];
}

const bundled = (
  family: string,
  category: FontCategory,
  weights: readonly [number, number],
  variable = true,
): FontDefinition => ({ family, category, bundled: true, variable, weights });

const device = (family: string, category: FontCategory): FontDefinition => ({
  family,
  category,
  bundled: false,
  weights: [400, 700],
});

export const FONTS: readonly FontDefinition[] = [
  bundled('Inter', 'sans-serif', [100, 900]),
  bundled('Montserrat', 'sans-serif', [100, 900]),
  bundled('Outfit', 'sans-serif', [100, 900]),
  bundled('Nunito', 'sans-serif', [200, 1000]),
  bundled('Space Grotesk', 'sans-serif', [300, 700]),
  bundled('Playfair Display', 'serif', [400, 900]),
  bundled('Lora', 'serif', [400, 700]),
  bundled('Merriweather', 'serif', [300, 900]),
  bundled('Oswald', 'display', [200, 700]),
  bundled('Bebas Neue', 'display', [400, 400], false),
  bundled('Archivo Black', 'display', [400, 400], false),
  bundled('Pacifico', 'handwriting', [400, 400], false),
  bundled('Dancing Script', 'handwriting', [400, 700]),
  bundled('Great Vibes', 'handwriting', [400, 400], false),
  bundled('Caveat', 'handwriting', [400, 700]),
  device('Arial', 'sans-serif'),
  device('Verdana', 'sans-serif'),
  device('Georgia', 'serif'),
  device('Times New Roman', 'serif'),
  device('Courier New', 'monospace'),
];

const BY_NAME: ReadonlyMap<string, FontDefinition> = new Map(
  FONTS.map((font) => [font.family.toLowerCase(), font]),
);

export function getFont(family: string): FontDefinition | undefined {
  return BY_NAME.get(family.trim().toLowerCase());
}

const GENERIC: Record<FontCategory, string> = {
  'sans-serif': 'sans-serif',
  serif: 'serif',
  display: 'sans-serif',
  handwriting: 'cursive',
  monospace: 'monospace',
};

/**
 * The CSS `font-family` value for a design font. Bundled fonts are tried under their
 * registered name first; names are quoted so any family name stays inside the declaration.
 */
export function fontStack(family: string): string {
  const font = getFont(family);
  const names = font
    ? font.variable
      ? [`${font.family} Variable`, font.family]
      : [font.family]
    : [family.trim() || 'Inter'];
  return [
    ...names.map((name) => JSON.stringify(name)),
    GENERIC[font?.category ?? 'sans-serif'],
  ].join(', ');
}
