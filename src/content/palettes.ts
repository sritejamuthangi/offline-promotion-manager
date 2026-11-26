import type { Theme } from '@/core/schema';

export type ThemeColors = Theme['colors'];

/**
 * One-click colour palettes. Templates colour everything through the theme slots, so
 * choosing a palette restyles the whole design. Every palette keeps these promises, which
 * a unit test checks with WCAG contrast ratios:
 *
 * - `text` reads well on `background` (7:1) and on `surface` cards (4.5:1).
 * - `muted` (secondary text) reads well on `background` and `surface` (4.5:1).
 * - `primary` works for headings on the page and as a block behind `background`-coloured
 *   text (4.5:1), and for large text on cards (3:1).
 * - `secondary` works for large text and shapes (3:1). `accent` is for decoration only.
 *
 * Names are translated under `styles.palettes.<id>`.
 */
export const PALETTES = [
  {
    id: 'violet',
    colors: {
      primary: '#6d28d9',
      secondary: '#0369a1',
      accent: '#f43f5e',
      background: '#ffffff',
      surface: '#f4f4f5',
      text: '#18181b',
      muted: '#52525b',
    },
  },
  {
    id: 'ocean',
    colors: {
      primary: '#0b4f8a',
      secondary: '#0e7490',
      accent: '#38bdf8',
      background: '#f5faff',
      surface: '#e3eef9',
      text: '#0b1f33',
      muted: '#3f566e',
    },
  },
  {
    id: 'forest',
    colors: {
      primary: '#166534',
      secondary: '#4d7c0f',
      accent: '#eab308',
      background: '#fbfdf7',
      surface: '#ebf3e4',
      text: '#132219',
      muted: '#45574a',
    },
  },
  {
    id: 'sunset',
    colors: {
      primary: '#c2410c',
      secondary: '#be123c',
      accent: '#fbbf24',
      background: '#fffaf5',
      surface: '#fdecdc',
      text: '#2a1608',
      muted: '#6b4a36',
    },
  },
  {
    id: 'berry',
    colors: {
      primary: '#9d174d',
      secondary: '#7e22ce',
      accent: '#f472b6',
      background: '#fff7fb',
      surface: '#fbe4ef',
      text: '#2a0d1c',
      muted: '#6b4558',
    },
  },
  {
    id: 'mint',
    colors: {
      primary: '#0f766e',
      secondary: '#047857',
      accent: '#fbbf24',
      background: '#f4fbf9',
      surface: '#ddf2ec',
      text: '#0f2421',
      muted: '#3f5f58',
    },
  },
  {
    id: 'sky',
    colors: {
      primary: '#1d4ed8',
      secondary: '#0e7490',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#eef4ff',
      text: '#0f172a',
      muted: '#475569',
    },
  },
  {
    id: 'earth',
    colors: {
      primary: '#7c4a24',
      secondary: '#9a5b13',
      accent: '#e9a23b',
      background: '#fbf7f1',
      surface: '#f1e7da',
      text: '#2b1d12',
      muted: '#66513f',
    },
  },
  {
    id: 'lavender',
    colors: {
      primary: '#5b3fa8',
      secondary: '#a23b8a',
      accent: '#f9a8d4',
      background: '#fbf9ff',
      surface: '#efe9fd',
      text: '#221a3a',
      muted: '#584f72',
    },
  },
  {
    id: 'citrus',
    colors: {
      primary: '#3f6212',
      secondary: '#b45309',
      accent: '#facc15',
      background: '#fffef5',
      surface: '#f6f5da',
      text: '#1f2410',
      muted: '#55593b',
    },
  },
  {
    id: 'mono',
    colors: {
      primary: '#18181b',
      secondary: '#52525b',
      accent: '#a1a1aa',
      background: '#ffffff',
      surface: '#f4f4f5',
      text: '#09090b',
      muted: '#52525b',
    },
  },
  {
    id: 'retro',
    colors: {
      primary: '#b23a48',
      secondary: '#1b6f80',
      accent: '#f2a541',
      background: '#fdf6e3',
      surface: '#f5e9c9',
      text: '#2b2a33',
      muted: '#5c5866',
    },
  },
  {
    id: 'candy',
    colors: {
      primary: '#c0267a',
      secondary: '#6d28d9',
      accent: '#f59e0b',
      background: '#fff8fc',
      surface: '#fde7f3',
      text: '#2d0f22',
      muted: '#6e4760',
    },
  },
  {
    id: 'terracotta',
    colors: {
      primary: '#a9471f',
      secondary: '#3f6e5b',
      accent: '#e9c46a',
      background: '#fbf6f0',
      surface: '#f2e6da',
      text: '#2d1e17',
      muted: '#68554a',
    },
  },
  {
    id: 'royal',
    colors: {
      primary: '#1e3a8a',
      secondary: '#9a7b18',
      accent: '#d4af37',
      background: '#fffdf7',
      surface: '#f5f0e1',
      text: '#141a2e',
      muted: '#4f5570',
    },
  },
  {
    id: 'blush',
    colors: {
      primary: '#9f3a5a',
      secondary: '#7a5c3e',
      accent: '#f4b6c2',
      background: '#fffafa',
      surface: '#fbecee',
      text: '#2e1a20',
      muted: '#6b5258',
    },
  },
  {
    id: 'midnight',
    colors: {
      primary: '#a5b4fc',
      secondary: '#38bdf8',
      accent: '#f472b6',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      muted: '#a3b0c2',
    },
  },
  {
    id: 'noir',
    colors: {
      primary: '#fbbf24',
      secondary: '#f59e0b',
      accent: '#fde68a',
      background: '#141414',
      surface: '#262626',
      text: '#fafaf9',
      muted: '#b5b0aa',
    },
  },
  {
    id: 'neon',
    colors: {
      primary: '#22d3ee',
      secondary: '#a3e635',
      accent: '#f472b6',
      background: '#0b0b16',
      surface: '#1a1a2e',
      text: '#f5f5ff',
      muted: '#a9a9c8',
    },
  },
  {
    id: 'evergreen',
    colors: {
      primary: '#86efac',
      secondary: '#fcd34d',
      accent: '#fb923c',
      background: '#0f1f17',
      surface: '#1b3326',
      text: '#effdf5',
      muted: '#a3c4b2',
    },
  },
] as const satisfies readonly { id: string; colors: ThemeColors }[];

export type PaletteId = (typeof PALETTES)[number]['id'];
export type Palette = (typeof PALETTES)[number];

export function getPalette(id: PaletteId): Palette {
  return PALETTES.find((palette) => palette.id === id) ?? PALETTES[0];
}

/** Plain, mutable copy of a palette's colours, ready to store in a design. */
export function paletteColors(id: PaletteId): ThemeColors {
  return { ...getPalette(id).colors };
}

/** True when a theme's colours are exactly this palette (any edit makes it a custom palette). */
export function isPalette(colors: ThemeColors, palette: Palette): boolean {
  return (Object.keys(palette.colors) as (keyof ThemeColors)[]).every(
    (key) => colors[key].toLowerCase() === palette.colors[key].toLowerCase(),
  );
}
