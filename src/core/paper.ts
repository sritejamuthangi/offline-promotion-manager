import { toPx, type Unit } from './units';

export const PRESET_CATEGORIES = [
  'paper',
  'poster',
  'card',
  'document',
  'photo',
  'social',
  'presentation',
  'banner',
  'envelope',
] as const;
export type PresetCategory = (typeof PRESET_CATEGORIES)[number];

export interface SizePresetDef {
  /** Stable ID. Display names live in the translation files under `presets.<id>`. */
  readonly id: string;
  readonly category: PresetCategory;
  readonly width: number;
  readonly height: number;
  readonly unit: Unit;
}

const preset = <const Id extends string>(
  id: Id,
  category: PresetCategory,
  width: number,
  height: number,
  unit: Unit,
) => ({ id, category, width, height, unit }) as const;

/**
 * Built-in design sizes. Dimensions are in the unit people use for that format, so
 * they display naturally (A4 in mm, US Letter in inches, social posts in pixels).
 */
export const SIZE_PRESETS = [
  // Paper: ISO 216 and North American sizes
  preset('a3', 'paper', 297, 420, 'mm'),
  preset('a4', 'paper', 210, 297, 'mm'),
  preset('a5', 'paper', 148, 210, 'mm'),
  preset('a6', 'paper', 105, 148, 'mm'),
  preset('b4', 'paper', 250, 353, 'mm'),
  preset('b5', 'paper', 176, 250, 'mm'),
  preset('letter', 'paper', 8.5, 11, 'in'),
  preset('legal', 'paper', 8.5, 14, 'in'),
  preset('tabloid', 'paper', 11, 17, 'in'),
  preset('half-letter', 'paper', 5.5, 8.5, 'in'),
  preset('executive', 'paper', 7.25, 10.5, 'in'),
  // Posters and flyers
  preset('poster-a2', 'poster', 420, 594, 'mm'),
  preset('poster-a1', 'poster', 594, 841, 'mm'),
  preset('poster-a0', 'poster', 841, 1189, 'mm'),
  preset('poster-18x24', 'poster', 18, 24, 'in'),
  preset('poster-24x36', 'poster', 24, 36, 'in'),
  preset('flyer-dl', 'poster', 99, 210, 'mm'),
  // Cards
  preset('business-card-intl', 'card', 85, 55, 'mm'),
  preset('business-card-us', 'card', 3.5, 2, 'in'),
  preset('id-card', 'card', 85.6, 53.98, 'mm'),
  preset('postcard-a6', 'card', 148, 105, 'mm'),
  preset('postcard-4x6', 'card', 6, 4, 'in'),
  preset('card-5x7', 'card', 5, 7, 'in'),
  preset('card-square', 'card', 140, 140, 'mm'),
  // Documents
  preset('certificate-a4', 'document', 297, 210, 'mm'),
  preset('certificate-letter', 'document', 11, 8.5, 'in'),
  preset('resume-a4', 'document', 210, 297, 'mm'),
  preset('resume-letter', 'document', 8.5, 11, 'in'),
  // Photos
  preset('photo-4x6', 'photo', 4, 6, 'in'),
  preset('photo-5x7', 'photo', 5, 7, 'in'),
  preset('photo-8x10', 'photo', 8, 10, 'in'),
  preset('passport-35x45', 'photo', 35, 45, 'mm'),
  preset('passport-2x2', 'photo', 2, 2, 'in'),
  // Social media
  preset('instagram-post', 'social', 1080, 1080, 'px'),
  preset('instagram-portrait', 'social', 1080, 1350, 'px'),
  preset('story', 'social', 1080, 1920, 'px'),
  preset('facebook-post', 'social', 1200, 630, 'px'),
  preset('facebook-cover', 'social', 851, 315, 'px'),
  preset('youtube-thumbnail', 'social', 1280, 720, 'px'),
  preset('x-post', 'social', 1600, 900, 'px'),
  preset('linkedin-post', 'social', 1200, 627, 'px'),
  preset('pinterest-pin', 'social', 1000, 1500, 'px'),
  // Presentations
  preset('slide-16x9', 'presentation', 1920, 1080, 'px'),
  preset('slide-4x3', 'presentation', 1024, 768, 'px'),
  // Banners
  preset('rollup-banner', 'banner', 850, 2000, 'mm'),
  preset('banner-6x3ft', 'banner', 72, 36, 'in'),
  // Envelopes
  preset('envelope-dl', 'envelope', 220, 110, 'mm'),
  preset('envelope-c5', 'envelope', 229, 162, 'mm'),
  preset('envelope-10', 'envelope', 9.5, 4.125, 'in'),
] as const satisfies readonly SizePresetDef[];

export type SizePreset = (typeof SIZE_PRESETS)[number];
export type PresetId = SizePreset['id'];

const PRESETS_BY_ID: ReadonlyMap<string, SizePreset> = new Map(SIZE_PRESETS.map((p) => [p.id, p]));

export function getPreset(id: string): SizePreset | undefined {
  return PRESETS_BY_ID.get(id);
}

export function presetsInCategory(category: PresetCategory): SizePreset[] {
  return SIZE_PRESETS.filter((p) => p.category === category);
}

export interface SizePx {
  width: number;
  height: number;
}

export function presetSizePx(p: SizePresetDef): SizePx {
  return { width: toPx(p.width, p.unit), height: toPx(p.height, p.unit) };
}

export type Orientation = 'portrait' | 'landscape' | 'square';

export function orientationOf(width: number, height: number): Orientation {
  if (Math.abs(width - height) < 1e-6) return 'square';
  return width > height ? 'landscape' : 'portrait';
}

/** Returns the size rotated to the requested orientation (squares are unchanged). */
export function withOrientation(size: SizePx, orientation: 'portrait' | 'landscape'): SizePx {
  const current = orientationOf(size.width, size.height);
  if (current === 'square' || current === orientation) return size;
  return { width: size.height, height: size.width };
}

/** Finds the preset matching a px size in either orientation, within `tolerancePx`. */
export function findPresetBySize(
  widthPx: number,
  heightPx: number,
  tolerancePx = 0.5,
): SizePreset | undefined {
  const near = (a: number, b: number) => Math.abs(a - b) <= tolerancePx;
  return SIZE_PRESETS.find((p) => {
    const s = presetSizePx(p);
    return (
      (near(s.width, widthPx) && near(s.height, heightPx)) ||
      (near(s.width, heightPx) && near(s.height, widthPx))
    );
  });
}
