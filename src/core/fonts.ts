import { type CodeRange, codePointsOf, inRanges } from './unicode';

/**
 * Fonts people can pick. Bundled fonts ship with the app (SIL Open Font License), so designs
 * look the same on every device, offline and in print. Device fonts depend on what is
 * installed and may fall back to a similar font, especially on phones.
 *
 * Writing systems: the design fonts cover Latin, Greek and Cyrillic, with Inter filling any
 * gaps. Bundled Noto fonts draw the other widely used scripts. They follow the chosen font
 * in every font stack, so text in any of these languages uses bundled fonts on every
 * device, and browsers download only the parts of a font that a text needs.
 *
 * Adding a bundled font: install its `@fontsource` package, import it in
 * `src/styles/fonts.ts` (`scriptFonts.ts` for writing systems) and list it here. A unit test
 * checks they stay in sync.
 */
export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';

export interface ScriptFont {
  /** The writing system's name, written in it, as shown in the font picker. */
  readonly sample: string;
  /** Characters that identify the writing system. */
  readonly ranges: readonly CodeRange[];
  /** Used automatically for text the chosen font cannot draw. */
  readonly fallback: boolean;
}

export interface FontDefinition {
  /** The name stored in designs. */
  readonly family: string;
  readonly category: FontCategory;
  readonly bundled: boolean;
  /** Bundled variable fonts register as "<family> Variable" (Fontsource convention). */
  readonly variable?: boolean;
  /** Lightest and heaviest weight the font provides. */
  readonly weights: readonly [number, number];
  /** Fonts made for one writing system, listed apart in the font picker. */
  readonly script?: ScriptFont;
}

const bundled = (
  family: string,
  category: FontCategory,
  weights: readonly [number, number],
  variable = true,
): FontDefinition => ({ family, category, bundled: true, variable, weights });

const script = (
  family: string,
  sample: string,
  ranges: readonly CodeRange[],
  options: {
    weights?: readonly [number, number];
    fallback?: boolean;
    category?: FontCategory;
  } = {},
): FontDefinition => ({
  family,
  category: options.category ?? 'sans-serif',
  bundled: true,
  variable: true,
  weights: options.weights ?? [100, 900],
  script: { sample, ranges, fallback: options.fallback ?? true },
});

const device = (family: string, category: FontCategory): FontDefinition => ({
  family,
  category,
  bundled: false,
  weights: [400, 700],
});

const ARABIC: readonly CodeRange[] = [
  [0x0600, 0x06ff],
  [0x0750, 0x077f],
  [0x0870, 0x08ff],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfeff],
];
/** Hiragana and katakana: only Japanese uses them. */
const KANA: readonly CodeRange[] = [
  [0x3040, 0x30ff],
  [0x31f0, 0x31ff],
  [0xff66, 0xff9f],
];
/** Hangul: only Korean uses it. */
const HANGUL: readonly CodeRange[] = [
  [0x1100, 0x11ff],
  [0x3130, 0x318f],
  [0xa960, 0xa97f],
  [0xac00, 0xd7ff],
];
/** Chinese characters and CJK punctuation, shared by Chinese, Japanese and Korean. */
export const HAN: readonly CodeRange[] = [
  [0x2e80, 0x2fdf],
  [0x3000, 0x303f],
  [0x3100, 0x312f],
  [0x31a0, 0x31ef],
  [0x3200, 0x33ff],
  [0x3400, 0x4dbf],
  [0x4e00, 0x9fff],
  [0xf900, 0xfaff],
  [0xfe30, 0xfe4f],
  [0xff00, 0xff65],
  [0xffe0, 0xffef],
  [0x20000, 0x3134f],
];

const JAPANESE = 'Noto Sans JP';
const KOREAN = 'Noto Sans KR';
const SIMPLIFIED_CHINESE = 'Noto Sans SC';
const TRADITIONAL_CHINESE = 'Noto Sans TC';

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
  // Writing systems, in fallback order. Chinese, Japanese and Korean come last and are
  // ordered for each text (see `fallbackOrder`).
  script('Noto Sans Arabic', 'العربية', ARABIC),
  script('Noto Naskh Arabic', 'العربية', ARABIC, {
    weights: [400, 700],
    fallback: false,
    category: 'serif',
  }),
  script('Noto Sans Hebrew', 'עברית', [
    [0x0590, 0x05ff],
    [0xfb1d, 0xfb4f],
  ]),
  script('Noto Sans Devanagari', 'देवनागरी', [
    [0x0900, 0x097f],
    [0x1cd0, 0x1cff],
    [0xa8e0, 0xa8ff],
  ]),
  script('Noto Sans Bengali', 'বাংলা', [[0x0980, 0x09ff]]),
  script('Noto Sans Gurmukhi', 'ਗੁਰਮੁਖੀ', [[0x0a00, 0x0a7f]]),
  script('Noto Sans Gujarati', 'ગુજરાતી', [[0x0a80, 0x0aff]]),
  script('Noto Sans Oriya', 'ଓଡ଼ିଆ', [[0x0b00, 0x0b7f]]),
  script('Noto Sans Tamil', 'தமிழ்', [
    [0x0b80, 0x0bff],
    [0x11fc0, 0x11fff],
  ]),
  script('Noto Sans Telugu', 'తెలుగు', [[0x0c00, 0x0c7f]]),
  script('Noto Sans Kannada', 'ಕನ್ನಡ', [[0x0c80, 0x0cff]]),
  script('Noto Sans Malayalam', 'മലയാളം', [[0x0d00, 0x0d7f]]),
  script('Noto Sans Sinhala', 'සිංහල', [
    [0x0d80, 0x0dff],
    [0x111e0, 0x111ff],
  ]),
  script('Noto Sans Thai', 'ไทย', [[0x0e00, 0x0e7f]]),
  script('Noto Sans Lao', 'ລາວ', [[0x0e80, 0x0eff]]),
  script('Noto Sans Khmer', 'ខ្មែរ', [
    [0x1780, 0x17ff],
    [0x19e0, 0x19ff],
  ]),
  script('Noto Sans Myanmar', 'မြန်မာ', [
    [0x1000, 0x109f],
    [0xa9e0, 0xa9ff],
    [0xaa60, 0xaa7f],
  ]),
  script('Noto Sans Ethiopic', 'ግዕዝ', [
    [0x1200, 0x139f],
    [0x2d80, 0x2ddf],
    [0xab00, 0xab2f],
  ]),
  script('Noto Sans Armenian', 'Հայերեն', [
    [0x0530, 0x058f],
    [0xfb13, 0xfb17],
  ]),
  script('Noto Sans Georgian', 'ქართული', [
    [0x10a0, 0x10ff],
    [0x1c90, 0x1cbf],
    [0x2d00, 0x2d2f],
  ]),
  script(SIMPLIFIED_CHINESE, '简体中文', HAN),
  script(TRADITIONAL_CHINESE, '繁體中文', HAN),
  script(JAPANESE, '日本語', KANA),
  script(KOREAN, '한국어', HANGUL),
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

/** Names a font is registered under in the document, the bundled variable font first. */
export function registeredNames(font: FontDefinition): string[] {
  return font.variable ? [`${font.family} Variable`, font.family] : [font.family];
}

const GENERIC: Record<FontCategory, string> = {
  'sans-serif': 'sans-serif',
  serif: 'serif',
  display: 'sans-serif',
  handwriting: 'cursive',
  monospace: 'monospace',
};

const CJK = new Set([SIMPLIFIED_CHINESE, TRADITIONAL_CHINESE, JAPANESE, KOREAN]);
const FALLBACKS = FONTS.filter((font) => font.script?.fallback);
const OTHER_SCRIPTS = FALLBACKS.filter((font) => !CJK.has(font.family));
/** Fonts whose writing system can be recognised from a text's characters. */
const RECOGNISABLE = [
  ...OTHER_SCRIPTS,
  ...FALLBACKS.filter((font) => font.family === JAPANESE || font.family === KOREAN),
];

/**
 * Chinese characters look different in Chinese (simplified or traditional), Japanese and
 * Korean. Without kana or hangul to tell, the design's language decides.
 */
export function preferredHanFont(locale: string | undefined): string {
  if (locale) {
    try {
      const { language, script: writing } = new Intl.Locale(locale).maximize();
      if (language === 'ja') return JAPANESE;
      if (language === 'ko') return KOREAN;
      if (writing === 'Hant') return TRADITIONAL_CHINESE;
    } catch {
      // Not a valid language tag: use the most widely read form.
    }
  }
  return SIMPLIFIED_CHINESE;
}

const defaultOrders = new Map<string, readonly string[]>();

function defaultOrder(locale: string | undefined): readonly string[] {
  const key = locale ?? '';
  let order = defaultOrders.get(key);
  if (!order) {
    const han = preferredHanFont(locale);
    order = [
      ...OTHER_SCRIPTS.map((font) => font.family),
      han,
      ...[SIMPLIFIED_CHINESE, TRADITIONAL_CHINESE, JAPANESE, KOREAN].filter((name) => name !== han),
    ];
    defaultOrders.set(key, order);
  }
  return order;
}

/**
 * Writing-system fonts in the order a text should try them: the scripts it uses first, in
 * order of appearance, so shared characters (such as the Devanagari danda in Bengali text)
 * come from the right font. Chinese characters follow Japanese or Korean text, or else the
 * design's language.
 */
export function fallbackOrder(text: string | undefined, locale?: string): readonly string[] {
  const order = defaultOrder(locale);
  if (!text) return order;
  const found: string[] = [];
  let han = false;
  for (const point of codePointsOf(text)) {
    // Latin, Greek and Cyrillic are drawn by the chosen font or Inter.
    if (point < 0x0530) continue;
    if (inRanges(point, HAN)) {
      han = true;
      continue;
    }
    for (const font of RECOGNISABLE)
      if (font.script && inRanges(point, font.script.ranges) && !found.includes(font.family))
        found.push(font.family);
  }
  if (han && !found.includes(JAPANESE) && !found.includes(KOREAN))
    found.push(preferredHanFont(locale));
  if (!found.length) return order;
  return [...found, ...order.filter((family) => !found.includes(family))];
}

/** True for a character of a writing system drawn by the bundled writing-system fonts. */
export function isScriptFontPoint(point: number): boolean {
  if (point < 0x0530) return false;
  if (inRanges(point, HAN)) return true;
  for (const font of RECOGNISABLE)
    if (font.script && inRanges(point, font.script.ranges)) return true;
  return false;
}

/** True when a text uses a writing system drawn by the bundled writing-system fonts. */
export function usesScriptFonts(text: string): boolean {
  return codePointsOf(text).some(isScriptFontPoint);
}

export interface FontContext {
  /** The text drawn with the font, to order writing-system fonts. */
  text?: string;
  /** The design's language, for Chinese characters. */
  locale?: string;
}

/**
 * Font family names to try for a design font, as registered in the document: the font
 * itself, Inter for missing Latin, Greek or Cyrillic letters, then a bundled font for
 * every other writing system.
 */
export function fontFamilies(family: string, context: FontContext = {}): string[] {
  const font = getFont(family);
  const own = font ? registeredNames(font) : [family.trim() || 'Inter'];
  const scripts = fallbackOrder(context.text, context.locale).map((name) => `${name} Variable`);
  return [...new Set([...own, 'Inter Variable', ...scripts])];
}

/**
 * The CSS `font-family` value for a design font. Names are quoted, so any family name
 * stays inside the declaration, and a generic family comes last for emoji and symbols.
 */
export function fontStack(family: string, context?: FontContext): string {
  const generic = GENERIC[getFont(family)?.category ?? 'sans-serif'];
  return [...fontFamilies(family, context).map((name) => JSON.stringify(name)), generic].join(', ');
}
