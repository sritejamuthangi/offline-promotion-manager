import { fontFamilies, getFont, registeredNames } from '../fonts';
import { type Design, type Fill, type Page, resolveFont } from '../schema';
import { codePointsOf } from '../unicode';

function pagesOf(design: Design, pageIndexes?: readonly number[]): Page[] {
  if (!pageIndexes) return design.pages;
  return pageIndexes.flatMap((index) => {
    const page = design.pages[index];
    return page ? [page] : [];
  });
}

const fillSource = (fill: Fill | undefined) => (fill?.type === 'image' ? [fill.src] : []);

/** Every image the pages show: pictures, logos and image fills. */
export function imageSources(design: Design, pageIndexes?: readonly number[]): string[] {
  const sources = new Set<string>();
  for (const page of pagesOf(design, pageIndexes)) {
    for (const src of fillSource(page.background)) sources.add(src);
    for (const element of page.elements) {
      if (element.hidden) continue;
      if (element.type === 'image') sources.add(element.src);
      if (element.type === 'grid') {
        for (const src of fillSource(element.cardFill)) sources.add(src);
        for (const item of element.items) if (item.logoSrc) sources.add(item.logoSrc);
      }
    }
  }
  return [...sources];
}

/** Text drawn with one font stack: what an export must embed fonts for. */
export interface TextRun {
  /** Families in the order the browser tries them, as registered in the document. */
  families: string[];
  /** The chosen font's names. Its faces are required; the rest are fallbacks. */
  primary: string[];
  italic: boolean;
  /** Every distinct character, in each letter case a text style may apply. */
  codePoints: number[];
}

const PRINTABLE_ASCII = Array.from({ length: 0x7f - 0x20 }, (_, i) =>
  String.fromCharCode(0x20 + i),
);

/**
 * The text runs of the pages. Runs keep each text's own font order, because the writing
 * systems in a text decide which fallback fonts draw it (see `fontFamilies`).
 */
export function textRuns(design: Design, pageIndexes?: readonly number[]): TextRun[] {
  const locale = design.meta.locale;
  const runs: TextRun[] = [
    // Inter draws text without a font of its own, such as placeholders.
    {
      families: ['Inter Variable', 'Inter'],
      primary: ['Inter Variable', 'Inter'],
      italic: false,
      codePoints: codePointsOf(PRINTABLE_ASCII.join('')),
    },
  ];
  const add = (value: string, text: string, italic = false) => {
    const family = resolveFont(value, design.theme).trim();
    const font = getFont(family);
    runs.push({
      families: fontFamilies(family, { text, locale }),
      primary: font ? registeredNames(font) : [family],
      italic,
      codePoints: codePointsOf(`${text}${text.toUpperCase()}${text.toLowerCase()}`),
    });
  };
  for (const page of pagesOf(design, pageIndexes))
    for (const element of page.elements) {
      if (element.hidden) continue;
      if (element.type === 'text')
        add(element.style.fontFamily, element.text, element.style.italic);
      if (element.type === 'grid') {
        for (const item of element.items) {
          // Logos without a picture show the name's first letter in the name font.
          add(element.nameStyle.fontFamily, `${item.name} ${item.name.trim().charAt(0)}•`);
          if (item.subtitle) add(element.subtitleStyle.fontFamily, item.subtitle);
        }
      }
    }
  return runs;
}
