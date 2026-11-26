import { z } from 'zod';
import { HexColorSchema, type ThemeColorKey } from './primitives';

export const ThemeSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  colors: z.object({
    primary: HexColorSchema,
    secondary: HexColorSchema,
    accent: HexColorSchema,
    background: HexColorSchema,
    surface: HexColorSchema,
    text: HexColorSchema,
    muted: HexColorSchema,
  }),
  fonts: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
  }),
});
export type Theme = z.infer<typeof ThemeSchema>;

export const DEFAULT_THEME: Theme = {
  id: 'default',
  name: 'Default',
  // Matches the "Violet" palette in src/content/palettes.ts.
  colors: {
    primary: '#6d28d9',
    secondary: '#0369a1',
    accent: '#f43f5e',
    background: '#ffffff',
    surface: '#f4f4f5',
    text: '#18181b',
    muted: '#52525b',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
  },
};

/** Turns a colour value into a concrete hex colour, resolving `$slot` tokens against the theme. */
export function resolveColor(value: string, theme: Theme): string {
  if (value.startsWith('$')) {
    const key = value.slice(1) as ThemeColorKey;
    return theme.colors[key] ?? theme.colors.text;
  }
  return value;
}

/** Turns a font value into a concrete family name, resolving `$heading` / `$body`. */
export function resolveFont(value: string, theme: Theme): string {
  if (value === '$heading') return theme.fonts.heading;
  if (value === '$body') return theme.fonts.body;
  return value;
}
