import { describe, expect, it } from 'vitest';
import type { Theme } from '../schema';
import { createDesign } from './factory';
import { applyThemeColors, applyThemeFonts } from './theme';

const ocean: Theme['colors'] = {
  primary: '#0b4f8a',
  secondary: '#0e7490',
  accent: '#38bdf8',
  background: '#f5faff',
  surface: '#e3eef9',
  text: '#0b1f33',
  muted: '#3f566e',
};

describe('applyThemeColors', () => {
  it('replaces every colour slot without sharing the object', () => {
    const design = createDesign({ name: 'A', width: 100, height: 100, unit: 'px' });
    applyThemeColors(design, ocean);
    expect(design.theme.colors).toEqual(ocean);
    design.theme.colors.primary = '#000000';
    expect(ocean.primary).toBe('#0b4f8a');
  });

  it('links plain page colours that matched the old theme background', () => {
    const design = createDesign({
      name: 'Old',
      width: 100,
      height: 100,
      unit: 'px',
      background: { type: 'solid', color: '#FFFFFF' },
    });
    design.pages.push({ id: 'p2', background: { type: 'solid', color: '#ff0000' }, elements: [] });
    applyThemeColors(design, ocean);
    expect(design.pages[0]?.background).toEqual({ type: 'solid', color: '$background' });
    expect(design.pages[1]?.background).toEqual({ type: 'solid', color: '#ff0000' });
  });
});

describe('applyThemeFonts', () => {
  it('sets both font slots', () => {
    const design = createDesign({ name: 'A', width: 100, height: 100, unit: 'px' });
    applyThemeFonts(design, { heading: 'Oswald', body: 'Lora' });
    expect(design.theme.fonts).toEqual({ heading: 'Oswald', body: 'Lora' });
  });
});
