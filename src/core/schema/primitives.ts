import { z } from 'zod';
import { UNITS } from '../units';

export const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Colour slots every theme provides. Templates refer to them as `$primary`, `$text`, ... */
export const THEME_COLOR_KEYS = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'muted',
] as const;
export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];

/** Font slots every theme provides. Templates refer to them as `$heading` and `$body`. */
export const THEME_FONT_KEYS = ['heading', 'body'] as const;
export type ThemeFontKey = (typeof THEME_FONT_KEYS)[number];

export const HexColorSchema = z
  .string()
  .regex(HEX_COLOR_PATTERN, { error: 'Expected a hex colour such as #1f2937' });

export const ThemeColorTokenSchema = z.templateLiteral(['$', z.enum(THEME_COLOR_KEYS)]);

/**
 * A literal colour (`#1f2937`, or `#1f293780` with alpha) or a theme slot (`$primary`).
 * Theme slots are what make one-click restyling of templates possible.
 */
export const ColorValueSchema = z.union([HexColorSchema, ThemeColorTokenSchema]);
export type ColorValue = z.infer<typeof ColorValueSchema>;

/** A font family name (`Inter`) or a theme slot (`$heading`, `$body`). */
export const FontValueSchema = z.string().min(1).max(200);

export const UnitSchema = z.enum(UNITS);
