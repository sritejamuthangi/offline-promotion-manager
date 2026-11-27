import { getFont } from '../fonts';
import { type Design, type Fill, type Page, resolveFont } from '../schema';

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

/**
 * Font families and styles the pages use, as registered in the document: bundled variable fonts
 * under both "<family> Variable" and their plain name. Inter is the default for any text
 * without its own font.
 */
export function fontUsage(
  design: Design,
  pageIndexes?: readonly number[],
): Map<string, Set<string>> {
  const names = new Map<string, Set<string>>([
    ['Inter Variable', new Set(['normal'])],
    ['Inter', new Set(['normal'])],
  ]);
  const addName = (family: string, italic: boolean) => {
    const styles = names.get(family) ?? new Set(['normal']);
    if (italic) styles.add('italic');
    names.set(family, styles);
  };
  const add = (value: string, italic = false) => {
    const family = resolveFont(value, design.theme).trim();
    const font = getFont(family);
    if (font?.variable) addName(`${font.family} Variable`, italic);
    addName(font?.family ?? family, italic);
  };
  for (const page of pagesOf(design, pageIndexes))
    for (const element of page.elements) {
      if (element.hidden) continue;
      if (element.type === 'text') add(element.style.fontFamily, element.style.italic);
      if (element.type === 'grid') {
        add(element.nameStyle.fontFamily);
        add(element.subtitleStyle.fontFamily);
      }
    }
  return names;
}

/** Every character the pages can show, in each letter case a text style may apply. */
export function textCodePoints(design: Design, pageIndexes?: readonly number[]): Set<number> {
  const points = new Set<number>();
  for (let code = 0x20; code < 0x7f; code++) points.add(code);
  const add = (text: string) => {
    for (const variant of [text, text.toUpperCase(), text.toLowerCase()])
      for (const ch of variant) points.add(ch.codePointAt(0) ?? 0);
  };
  for (const page of pagesOf(design, pageIndexes))
    for (const element of page.elements) {
      if (element.type === 'text') add(element.text);
      if (element.type === 'grid')
        for (const item of element.items) add(`${item.name}${item.subtitle ?? ''}•`);
    }
  return points;
}
