import type { Design, Theme } from '../schema';

/**
 * Applies new theme colours to a design (or an Immer draft of one). Older designs stored
 * the page colour as plain hex; pages still using the old theme background are linked to
 * the `$background` slot so they follow the new palette too.
 */
export function applyThemeColors(design: Design, colors: Theme['colors']): void {
  const previous = design.theme.colors.background.toLowerCase();
  design.theme.colors = { ...colors };
  for (const page of design.pages) {
    if (page.background.type === 'solid' && page.background.color.toLowerCase() === previous)
      page.background = { type: 'solid', color: '$background' };
  }
}

export function applyThemeFonts(design: Design, fonts: Theme['fonts']): void {
  design.theme.fonts = { ...fonts };
}
