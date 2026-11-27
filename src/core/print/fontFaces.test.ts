import { describe, expect, it } from 'vitest';
import { createDesign } from '../design/factory';
import type { DesignElement, GridElement, TextElement } from '../schema';
import { parseUnicodeRange } from '../unicode';
import { type TextRun, textRuns } from './content';
import { type FaceInfo, selectFaces } from './fontFaces';

const face = (family: string, range: string, style = 'normal'): FaceInfo => ({
  family,
  style,
  ranges: parseUnicodeRange(range),
});

const LATIN = 'U+0000-00FF';
const faces = [
  face('Montserrat Variable', LATIN),
  face('Montserrat Variable', 'U+0100-024F'),
  face('Inter Variable', LATIN),
  face('Inter Variable', 'U+0370-03FF'),
  face('Inter Variable', LATIN, 'italic'),
  face('Noto Sans Telugu Variable', 'U+0C00-0C7F, U+200C-200D'),
  face('Noto Sans Telugu Variable', LATIN),
  face('Noto Sans JP Variable', 'U+3040-30FF'),
  face('Noto Sans JP Variable', 'U+6771, U+4EAC'),
  face('Noto Sans SC Variable', 'U+6B22, U+4EAC'),
];

const run = (text: string, families: string[], italic = false): TextRun => ({
  families,
  primary: families.slice(0, 2),
  italic,
  codePoints: [...new Set([...text].map((ch) => ch.codePointAt(0) ?? 0))],
});

const stack = [
  'Montserrat Variable',
  'Montserrat',
  'Inter Variable',
  'Noto Sans Telugu Variable',
  'Noto Sans JP Variable',
  'Noto Sans SC Variable',
];

function chosen(runs: TextRun[]) {
  return [...selectFaces(faces, runs)].map(([f, required]) => [
    `${f.family} ${f.style} ${f.ranges[0]?.[0].toString(16)}`,
    required,
  ]);
}

describe('selecting font faces for an export', () => {
  it('embeds only the faces that draw the text, as the browser would choose them', () => {
    expect(chosen([run('Hi', stack)])).toEqual([['Montserrat Variable normal 0', true]]);
    // Greek falls back to Inter; Telugu to its font, but not that font's Latin face.
    expect(chosen([run('Ωమ', stack)])).toEqual([
      ['Inter Variable normal 370', false],
      ['Noto Sans Telugu Variable normal c00', false],
    ]);
  });

  it('follows each text’s own order for shared Chinese characters', () => {
    const japanese = run('東京', stack);
    const chinese = run('京', [
      ...stack.slice(0, 4),
      'Noto Sans SC Variable',
      'Noto Sans JP Variable',
    ]);
    expect(chosen([japanese])).toEqual([['Noto Sans JP Variable normal 6771', false]]);
    expect(chosen([chinese])).toEqual([['Noto Sans SC Variable normal 6b22', false]]);
  });

  it('uses italic faces for italic text when the family has them', () => {
    expect(chosen([run('a', ['Inter Variable', 'Inter'], true)])).toEqual([
      ['Inter Variable italic 0', true],
    ]);
    // Without italic faces, browsers slant the upright face.
    expect(chosen([run('a', stack, true)])).toEqual([['Montserrat Variable normal 0', true]]);
  });

  it('requires the chosen font even when a fallback also draws some of the text', () => {
    const telugu = run('మa', ['Noto Sans Telugu Variable', 'Noto Sans Telugu', 'Inter Variable']);
    const result = selectFaces(faces, [telugu, run('ab', stack)]);
    const required = [...result].filter(([, value]) => value).map(([f]) => f.family);
    expect(required.sort()).toEqual([
      'Montserrat Variable',
      'Noto Sans Telugu Variable',
      'Noto Sans Telugu Variable',
    ]);
  });

  it('leaves out characters no bundled face covers, such as emoji', () => {
    expect(chosen([run('😀', stack)])).toEqual([]);
  });
});

describe('text runs', () => {
  const base = createDesign({ name: 'Runs', width: 400, height: 300, unit: 'px', now: 0 });
  const text = (value: string, extra: Partial<TextElement['style']> = {}): TextElement => ({
    id: value,
    type: 'text',
    text: value,
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    rotation: 0,
    opacity: 1,
    direction: 'auto',
    style: {
      fontFamily: '$heading',
      fontSize: 20,
      fontWeight: 400,
      color: '$text',
      align: 'start',
      verticalAlign: 'top',
      lineHeight: 1.2,
      letterSpacing: 0,
      ...extra,
    },
  });
  const withElements = (elements: DesignElement[], locale?: string) =>
    ({
      ...base,
      meta: { ...base.meta, locale },
      pages: [{ ...base.pages[0], elements }],
    }) as typeof base;

  it('keeps each text’s fonts, letter cases and language', () => {
    const design = withElements(
      [text('straße', { fontFamily: 'Lora', italic: true }), text('歡迎')],
      'zh-TW',
    );
    const runs = textRuns(design);
    expect(runs[0]?.primary).toEqual(['Inter Variable', 'Inter']);
    const lora = runs[1];
    expect(lora?.primary).toEqual(['Lora Variable', 'Lora']);
    expect(lora?.italic).toBe(true);
    // "STRASSE": upper-case variants are drawn too when a style changes the case.
    expect(lora?.codePoints).toContain('S'.codePointAt(0));
    const chinese = runs[2];
    expect(chinese?.families.indexOf('Noto Sans TC Variable')).toBeLessThan(
      chinese?.families.indexOf('Noto Sans SC Variable') ?? 0,
    );
  });

  it('skips hidden elements and includes Smart Grid names, initials and subtitles', () => {
    const grid = {
      id: 'g',
      type: 'grid',
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      rotation: 0,
      opacity: 1,
      columns: 2,
      gap: 4,
      padding: 4,
      cardPadding: 4,
      cardRadius: 4,
      logoHeight: 20,
      cardFill: { type: 'solid', color: '$surface' },
      nameStyle: { fontFamily: 'Oswald', fontSize: 12, fontWeight: 700, color: '$text' },
      subtitleStyle: { fontFamily: 'Inter', fontSize: 10, fontWeight: 400, color: '$muted' },
      items: [{ id: 'i', name: 'ಕನ್ನಡ', subtitle: 'Kannada' }],
    } as unknown as GridElement;
    const runs = textRuns(withElements([{ ...text('hidden'), hidden: true }, grid]));
    expect(runs.map((r) => r.primary[0])).toEqual([
      'Inter Variable',
      'Oswald Variable',
      'Inter Variable',
    ]);
    expect(runs[1]?.families[3]).toBe('Noto Sans Kannada Variable');
  });
});
