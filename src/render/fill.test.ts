import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME } from '@/core/schema';
import { cssUrl, fillToCss } from './fill';

describe('fillToCss', () => {
  it('renders solid colours and resolves theme tokens', () => {
    expect(fillToCss({ type: 'solid', color: '#ff0000' }, DEFAULT_THEME)).toEqual({
      backgroundColor: '#ff0000',
    });
    expect(fillToCss({ type: 'solid', color: '$primary' }, DEFAULT_THEME)).toEqual({
      backgroundColor: DEFAULT_THEME.colors.primary,
    });
  });

  it('renders gradients', () => {
    const linear = fillToCss(
      {
        type: 'linear',
        angle: 135,
        stops: [
          { offset: 0, color: '#000000' },
          { offset: 1, color: '#ffffff' },
        ],
      },
      DEFAULT_THEME,
    );
    expect(linear.backgroundImage).toBe('linear-gradient(135deg, #000000 0%, #ffffff 100%)');

    const radial = fillToCss(
      {
        type: 'radial',
        cx: 0.5,
        cy: 0.25,
        stops: [
          { offset: 0, color: '#000000' },
          { offset: 0.333, color: '$accent' },
        ],
      },
      DEFAULT_THEME,
    );
    expect(radial.backgroundImage).toBe(
      `radial-gradient(circle at 50% 25%, #000000 0%, ${DEFAULT_THEME.colors.accent} 33.3%)`,
    );
  });

  it('renders images only when the source can be resolved', () => {
    const fill = { type: 'image', src: 'asset:abc', fit: 'cover' } as const;
    expect(fillToCss(fill, DEFAULT_THEME)).toEqual({});
    expect(fillToCss(fill, DEFAULT_THEME, () => 'blob:x').backgroundImage).toBe('url("blob:x")');
  });

  it('escapes URLs so they cannot break out of CSS', () => {
    expect(cssUrl('a"b')).toBe('url("a\\22 b")');
    expect(cssUrl('a\\b')).toBe('url("a\\5c b")');
  });
});
