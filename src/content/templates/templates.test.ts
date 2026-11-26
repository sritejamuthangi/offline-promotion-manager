import { describe, expect, it } from 'vitest';
import { getFont } from '@/core/fonts';
import type { PaperFamily } from '@/core/locale';
import { type DesignElement, DesignSchema, type Fill } from '@/core/schema';
import { designFromTemplate, TEMPLATE_CATEGORIES, templateSize } from '@/core/templates';
import { getLibraryGraphic, libraryIdFromSrc } from '../library';
import { getTemplate, TEMPLATES } from './index';
import { NO_FILL } from './kit';

const PAPERS: PaperFamily[] = ['a4', 'letter'];
const cases = TEMPLATES.flatMap((template) =>
  PAPERS.map((paper) => [template.id, paper, template] as const),
);

function colorsOf(fill: Fill): string[] {
  if (fill.type === 'solid') return [fill.color];
  if (fill.type === 'image') return [];
  return fill.stops.map((stop) => stop.color);
}

function imageSources(element: DesignElement): string[] {
  if (element.type === 'image') return [element.src];
  if (element.type === 'grid')
    return element.items.flatMap((item) => (item.logoSrc ? [item.logoSrc] : []));
  return [];
}

describe('bundled templates', () => {
  it('have unique IDs, names and valid categories', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(50);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(TEMPLATES.map((t) => t.name)).size).toBe(TEMPLATES.length);
    for (const template of TEMPLATES) {
      expect(template.id).toMatch(/^[a-z0-9-]+$/);
      expect(template.name.trim()).not.toBe('');
      expect(TEMPLATE_CATEGORIES).toContain(template.category);
      expect(getTemplate(template.id)).toBe(template);
    }
    for (const category of TEMPLATE_CATEGORIES)
      expect(
        TEMPLATES.filter((t) => t.category === category).length,
        category,
      ).toBeGreaterThanOrEqual(7);
  });

  it.each(cases)('%s (%s) builds a valid, well-placed design', (_id, paper, template) => {
    const design = designFromTemplate(template, { paper, now: 1_750_000_000_000 });
    expect(DesignSchema.parse(design)).toEqual(design);
    expect(design.meta.templateId).toBe(template.id);
    expect(design.presetId).toBe(templateSize(template, paper).presetId);

    for (const font of Object.values(design.theme.fonts))
      expect(getFont(font)?.bundled, font).toBe(true);

    const ids = new Set<string>();
    for (const page of design.pages) {
      for (const color of colorsOf(page.background)) expect(color, 'page').toMatch(/^\$/);
      if (page.background.type === 'image')
        expect(getLibraryGraphic(libraryIdFromSrc(page.background.src) ?? '')).toBeDefined();
      for (const element of page.elements) {
        expect(ids.has(element.id), `duplicate ${element.id}`).toBe(false);
        ids.add(element.id);
        const label = `${element.type} ${element.id}`;
        // Every element is at least partly on the page.
        expect(element.x < design.width && element.x + element.width > 0, label).toBe(true);
        expect(element.y < design.height && element.y + element.height > 0, label).toBe(true);
        for (const src of imageSources(element))
          expect(getLibraryGraphic(libraryIdFromSrc(src) ?? ''), src).toBeDefined();

        if (element.type === 'text') {
          // Text sits fully on the page, follows the theme and stays legible in print.
          expect(element.x, label).toBeGreaterThanOrEqual(-0.5);
          expect(element.y, label).toBeGreaterThanOrEqual(-0.5);
          expect(element.x + element.width, label).toBeLessThanOrEqual(design.width + 0.5);
          expect(element.y + element.height, label).toBeLessThanOrEqual(design.height + 0.5);
          expect(element.style.color, label).toMatch(/^\$/);
          expect(['$heading', '$body'], label).toContain(element.style.fontFamily);
          expect(element.style.fontSize, label).toBeGreaterThanOrEqual(8);
          expect(element.text.trim(), label).not.toBe('');
        }
        if (element.type === 'shape' || element.type === 'sticker')
          for (const color of colorsOf(element.fill))
            expect(color === NO_FILL || color.startsWith('$'), label).toBe(true);
        if (element.type === 'icon' || element.type === 'line') {
          const color = element.type === 'icon' ? element.color : element.stroke.color;
          expect(color, label).toMatch(/^\$/);
        }
        if (element.type === 'qr') {
          expect(element.foreground).toBe('#000000');
          expect(element.background).toBe('#ffffff');
        }
      }
    }
  });

  it('marks replaceable content as placeholders', () => {
    for (const template of TEMPLATES) {
      const design = designFromTemplate(template, { paper: 'a4' });
      const elements = design.pages.flatMap((page) => page.elements);
      expect(
        elements.some((element) => element.placeholder),
        template.id,
      ).toBe(true);
    }
  });
});
