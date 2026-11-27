import { describe, expect, it } from 'vitest';
import imports from '../styles/fonts.ts?raw';
import scriptImports from '../styles/scriptFonts.ts?raw';
import {
  FONTS,
  fallbackOrder,
  fontFamilies,
  fontStack,
  getFont,
  preferredHanFont,
  usesScriptFonts,
} from './fonts';

const families = (stack: string) => stack.split(', ').map((name) => name.replaceAll('"', ''));

describe('fontStack', () => {
  it('prefers the bundled variable font, then the plain name, then Inter and world scripts', () => {
    const montserrat = families(fontStack('Montserrat'));
    expect(montserrat.slice(0, 4)).toEqual([
      'Montserrat Variable',
      'Montserrat',
      'Inter Variable',
      'Noto Sans Arabic Variable',
    ]);
    expect(montserrat.at(-1)).toBe('sans-serif');
    expect(fontStack('Playfair Display').endsWith(', serif')).toBe(true);
    expect(fontStack('Pacifico').startsWith('"Pacifico", "Inter Variable"')).toBe(true);
    expect(fontStack('Pacifico').endsWith(', cursive')).toBe(true);
  });

  it('keeps unknown and device fonts, quoted safely', () => {
    expect(fontStack('Georgia').startsWith('"Georgia", "Inter Variable"')).toBe(true);
    expect(fontStack('My "Fancy" Font').startsWith('"My \\"Fancy\\" Font", ')).toBe(true);
  });

  it('lists every writing-system fallback once', () => {
    const names = fontFamilies('Inter');
    expect(names[0]).toBe('Inter Variable');
    expect(new Set(names).size).toBe(names.length);
    const fallbacks = FONTS.filter((font) => font.script?.fallback);
    for (const font of fallbacks) expect(names).toContain(`${font.family} Variable`);
    // A chosen script font is tried first, not again later.
    const telugu = fontFamilies('Noto Sans Telugu');
    expect(telugu.slice(0, 2)).toEqual(['Noto Sans Telugu Variable', 'Noto Sans Telugu']);
    expect(telugu.filter((name) => name === 'Noto Sans Telugu Variable')).toHaveLength(1);
  });

  it('finds fonts case-insensitively', () => {
    expect(getFont('bebas neue')?.family).toBe('Bebas Neue');
    expect(getFont('Comic Sans')).toBeUndefined();
  });
});

describe('writing systems', () => {
  const first = (text: string, locale?: string) => fallbackOrder(text, locale)[0];

  it('puts the scripts a text uses first, in order of appearance', () => {
    expect(first('Hello నమస్తే')).toBe('Noto Sans Telugu');
    expect(fallbackOrder('বাংলা। हिन्दी').slice(0, 2)).toEqual([
      'Noto Sans Bengali',
      'Noto Sans Devanagari',
    ]);
    expect(first('مرحبا')).toBe('Noto Sans Arabic');
    expect(first('שלום')).toBe('Noto Sans Hebrew');
    expect(first('สวัสดี')).toBe('Noto Sans Thai');
    expect(first('ሰላም')).toBe('Noto Sans Ethiopic');
    expect(first('Hello')).toBe('Noto Sans Arabic');
  });

  it('draws Chinese characters in the style of the text or the design language', () => {
    expect(first('東京へようこそ')).toBe('Noto Sans JP');
    expect(first('서울 漢字')).toBe('Noto Sans KR');
    expect(first('欢迎光临')).toBe('Noto Sans SC');
    expect(first('歡迎光臨', 'zh-TW')).toBe('Noto Sans TC');
    expect(first('歡迎光臨', 'zh-HK')).toBe('Noto Sans TC');
    expect(first('東京', 'ja-JP')).toBe('Noto Sans JP');
    expect(preferredHanFont('ko')).toBe('Noto Sans KR');
    expect(preferredHanFont('zh-Hans-SG')).toBe('Noto Sans SC');
    expect(preferredHanFont('en-GB')).toBe('Noto Sans SC');
    expect(preferredHanFont('not a locale!')).toBe('Noto Sans SC');
    expect(preferredHanFont(undefined)).toBe('Noto Sans SC');
  });

  it('keeps every fallback in the order, whatever the text', () => {
    const all = fallbackOrder(undefined);
    for (const text of ['東京へようこそ', 'नमस्ते', 'abc', ''])
      expect([...fallbackOrder(text)].sort()).toEqual([...all].sort());
  });

  it('tells when a text needs the writing-system fonts', () => {
    expect(usesScriptFonts('Café, Ελληνικά, Кириллица → €5')).toBe(false);
    expect(usesScriptFonts('Price: ₹500 · ಕನ್ನಡ')).toBe(true);
    expect(usesScriptFonts('漢字')).toBe(true);
    expect(usesScriptFonts('ひらがな')).toBe(true);
  });
});

describe('bundled fonts', () => {
  it('are all imported, so they work offline', () => {
    for (const font of FONTS.filter((f) => f.bundled)) {
      const slug = font.family.toLowerCase().replace(/\s+/g, '-');
      const pkg = font.variable ? `@fontsource-variable/${slug}` : `@fontsource/${slug}`;
      expect(font.script ? scriptImports : imports, font.family).toContain(`'${pkg}'`);
    }
  });

  it('have unique names and sensible weights', () => {
    const names = FONTS.map((f) => f.family.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    for (const font of FONTS) {
      expect(font.weights[0]).toBeLessThanOrEqual(font.weights[1]);
      expect(font.weights[0]).toBeGreaterThanOrEqual(100);
      expect(font.weights[1]).toBeLessThanOrEqual(1000);
    }
  });

  it('describe each writing system with a sample written in it', () => {
    for (const font of FONTS.filter((f) => f.script)) {
      expect(font.script?.sample, font.family).toBeTruthy();
      expect(usesScriptFonts(font.script?.sample ?? ''), font.family).toBe(true);
    }
  });
});
