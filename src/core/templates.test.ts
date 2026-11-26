import { describe, expect, it } from 'vitest';
import { createDesign } from './design/factory';
import { UUID_V7_PATTERN } from './ids';
import { DEFAULT_THEME, DesignSchema } from './schema';
import {
  designFromSavedTemplate,
  designFromTemplate,
  matchesTemplateQuery,
  savedTemplateRef,
  type TemplateDefinition,
  templateSize,
  withFreshIds,
} from './templates';

const NOW = 1_750_000_000_000;

const sample: TemplateDefinition = {
  id: 'sample',
  name: 'Sample poster',
  description: 'A sample event poster.',
  category: 'events',
  tags: ['party'],
  size: { a4: 'a4', letter: 'letter' },
  theme: DEFAULT_THEME,
  build: ({ width, height }) => [
    {
      background: { type: 'solid', color: '$background' },
      elements: [
        {
          id: 'title',
          type: 'text',
          text: 'Hello',
          x: width * 0.1,
          y: height * 0.1,
          width: width * 0.8,
          height: 100,
          rotation: 0,
          opacity: 1,
          style: {
            fontFamily: '$heading',
            fontSize: 40,
            fontWeight: 700,
            color: '$text',
            align: 'center',
            verticalAlign: 'middle',
            lineHeight: 1.2,
            letterSpacing: 0,
          },
        },
        {
          id: 'grid',
          type: 'grid',
          x: 0,
          y: 200,
          width,
          height: 200,
          rotation: 0,
          opacity: 1,
          items: [{ id: 'a', name: 'A' }],
          gap: 4,
          padding: 4,
          cardPadding: 4,
          cardRadius: 4,
          logoHeight: 20,
          cardFill: { type: 'solid', color: '$surface' },
          nameStyle: { fontFamily: '$body', fontSize: 12, fontWeight: 600, color: '$text' },
          subtitleStyle: { fontFamily: '$body', fontSize: 10, fontWeight: 400, color: '$muted' },
        },
      ],
    },
  ],
};

describe('designFromTemplate', () => {
  it('builds a valid design at the size people use locally', () => {
    const a4 = designFromTemplate(sample, { paper: 'a4', now: NOW, locale: 'en-IN' });
    const letter = designFromTemplate(sample, { paper: 'letter', now: NOW });
    expect(DesignSchema.parse(a4)).toEqual(a4);
    expect(a4.presetId).toBe('a4');
    expect(a4.unit).toBe('mm');
    expect(letter.presetId).toBe('letter');
    expect(letter.unit).toBe('in');
    expect(letter.width).toBe(816);
    expect(a4.name).toBe('Sample poster');
    expect(a4.meta).toEqual({ templateId: 'sample', locale: 'en-IN' });
    expect(a4.createdAt).toBe(NOW);
  });

  it('lays the template out for the actual page size', () => {
    const letter = designFromTemplate(sample, { paper: 'letter', now: NOW });
    const title = letter.pages[0]?.elements[0];
    expect(title?.x).toBeCloseTo(81.6);
    expect(title?.width).toBeCloseTo(652.8);
  });

  it('gives pages, elements and grid items fresh IDs and never shares the theme', () => {
    const design = designFromTemplate(sample, { paper: 'a4', now: NOW });
    const page = design.pages[0];
    expect(page?.id).toMatch(UUID_V7_PATTERN);
    expect(page?.elements.map((e) => e.id).every((id) => UUID_V7_PATTERN.test(id))).toBe(true);
    const grid = page?.elements[1];
    expect(grid?.type === 'grid' && UUID_V7_PATTERN.test(grid.items[0]?.id ?? '')).toBe(true);
    design.theme.colors.primary = '#000000';
    expect(sample.theme.colors.primary).not.toBe('#000000');
  });

  it('reports the preset size', () => {
    expect(templateSize(sample, 'letter')).toEqual({
      presetId: 'letter',
      unit: 'in',
      width: 816,
      height: 1056,
    });
  });
});

describe('designFromSavedTemplate', () => {
  it('copies a saved design under new IDs and links it to the template', () => {
    const source = { ...createDesign({ name: 'Flyer', width: 400, height: 600, unit: 'px' }) };
    source.deletedAt = 5;
    const copy = designFromSavedTemplate(source, { templateId: 'abc', now: NOW });
    expect(DesignSchema.parse(copy)).toEqual(copy);
    expect(copy.id).not.toBe(source.id);
    expect(copy.pages[0]?.id).not.toBe(source.pages[0]?.id);
    expect(copy.deletedAt).toBeUndefined();
    expect(copy.name).toBe('Flyer');
    expect(copy.meta.templateId).toBe(savedTemplateRef('abc'));
    expect(copy.createdAt).toBe(NOW);
  });
});

describe('withFreshIds', () => {
  it('copies instead of sharing element objects', () => {
    const pages = sample.build({ width: 100, height: 100 });
    const copy = withFreshIds(pages, NOW);
    const first = copy[0]?.elements[0];
    if (first?.type !== 'text') throw new Error('expected text');
    first.text = 'Changed';
    expect(pages[0]?.elements[0]?.type === 'text' && pages[0].elements[0].text).toBe('Hello');
  });
});

describe('matchesTemplateQuery', () => {
  it('matches every word across fields, ignoring case and accents', () => {
    expect(matchesTemplateQuery('', ['anything'])).toBe(true);
    expect(matchesTemplateQuery('CAFE menu', ['Café menu', 'food'])).toBe(true);
    expect(matchesTemplateQuery('party poster', ['Event poster', 'party'])).toBe(true);
    expect(matchesTemplateQuery('wedding', ['Event poster', 'party'])).toBe(false);
  });
});
