import { describe, expect, it } from 'vitest';
import { createDesign, duplicateDesign } from '../design/factory';
import { UUID_V7_PATTERN } from '../ids';
import { toPx } from '../units';
import {
  ColorValueSchema,
  DEFAULT_THEME,
  DesignFormatError,
  DesignSchema,
  ElementSchema,
  migrateDesign,
  resolveColor,
  resolveFont,
  SCHEMA_VERSION,
} from './index';

const a4 = () =>
  createDesign({
    name: '  Poster  ',
    width: toPx(210, 'mm'),
    height: toPx(297, 'mm'),
    unit: 'mm',
    presetId: 'a4',
    locale: 'en-IN',
    now: 1_750_000_000_000,
  });

describe('createDesign', () => {
  it('creates a valid single-page design', () => {
    const design = a4();
    expect(DesignSchema.parse(design)).toEqual(design);
    expect(design.id).toMatch(UUID_V7_PATTERN);
    expect(design.name).toBe('Poster');
    expect(design.schemaVersion).toBe(SCHEMA_VERSION);
    expect(design.pages).toHaveLength(1);
    // The page follows the theme, so one-click palettes restyle it too.
    expect(design.pages[0]?.background).toEqual({ type: 'solid', color: '$background' });
    expect(resolveColor('$background', design.theme)).toBe('#ffffff');
    expect(design.meta.locale).toBe('en-IN');
    expect(design.deletedAt).toBeUndefined();
  });

  it('falls back to a default name and never shares the theme object', () => {
    const design = createDesign({ name: '   ', width: 100, height: 100, unit: 'px' });
    expect(design.name).toBe('Untitled design');
    design.theme.colors.primary = '#000000';
    expect(DEFAULT_THEME.colors.primary).not.toBe('#000000');
  });
});

describe('duplicateDesign', () => {
  it('copies content under a new ID and restores it from the trash', () => {
    const original = { ...a4(), deletedAt: 5 };
    const copy = duplicateDesign(original, { name: 'Poster (copy)', now: 1_760_000_000_000 });
    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('Poster (copy)');
    expect(copy.deletedAt).toBeUndefined();
    expect(copy.createdAt).toBe(1_760_000_000_000);
    expect(copy.pages[0]?.id).not.toBe(original.pages[0]?.id);
    expect(copy.width).toBe(original.width);
  });
});

describe('colours and fonts', () => {
  it('accepts hex colours and theme tokens only', () => {
    expect(ColorValueSchema.safeParse('#1f2937').success).toBe(true);
    expect(ColorValueSchema.safeParse('#1f293780').success).toBe(true);
    expect(ColorValueSchema.safeParse('$primary').success).toBe(true);
    expect(ColorValueSchema.safeParse('$nope').success).toBe(false);
    expect(ColorValueSchema.safeParse('red').success).toBe(false);
    expect(ColorValueSchema.safeParse('javascript:alert(1)').success).toBe(false);
  });

  it('resolves theme tokens', () => {
    expect(resolveColor('$primary', DEFAULT_THEME)).toBe(DEFAULT_THEME.colors.primary);
    expect(resolveColor('#123456', DEFAULT_THEME)).toBe('#123456');
    expect(resolveFont('$heading', DEFAULT_THEME)).toBe(DEFAULT_THEME.fonts.heading);
    expect(resolveFont('Roboto', DEFAULT_THEME)).toBe('Roboto');
  });
});

describe('elements', () => {
  it('validates a text element', () => {
    const text = {
      id: 't1',
      type: 'text',
      x: 10,
      y: 10,
      width: 200,
      height: 40,
      rotation: 0,
      opacity: 1,
      text: 'Hello',
      style: {
        fontFamily: '$heading',
        fontSize: 32,
        fontWeight: 700,
        color: '$text',
        align: 'center',
        verticalAlign: 'middle',
        lineHeight: 1.2,
        letterSpacing: 0,
      },
    };
    expect(ElementSchema.safeParse(text).success).toBe(true);
    expect(ElementSchema.safeParse({ ...text, width: -1 }).success).toBe(false);
    expect(ElementSchema.safeParse({ ...text, type: 'unknown' }).success).toBe(false);
  });
});

describe('migrateDesign', () => {
  it('accepts current designs', () => {
    const design = a4();
    expect(migrateDesign(JSON.parse(JSON.stringify(design)))).toEqual(design);
  });

  it('rejects files it cannot read, with a reason', () => {
    const code = (input: unknown) => {
      try {
        migrateDesign(input);
        return 'ok';
      } catch (error) {
        return error instanceof DesignFormatError ? error.code : 'other';
      }
    };
    expect(code('hello')).toBe('invalid');
    expect(code({})).toBe('unsupportedVersion');
    expect(code({ ...a4(), schemaVersion: SCHEMA_VERSION + 1 })).toBe('newerVersion');
    expect(code({ ...a4(), pages: [] })).toBe('invalid');
    expect(code({ ...a4(), width: 0 })).toBe('invalid');
  });
});
