import { uuidv7 } from '../ids';
import {
  DEFAULT_THEME,
  type Design,
  type Fill,
  MAX_NAME_LENGTH,
  SCHEMA_VERSION,
  type Theme,
} from '../schema';
import type { Unit } from '../units';

export interface CreateDesignInput {
  name: string;
  /** Page width in CSS px. */
  width: number;
  /** Page height in CSS px. */
  height: number;
  unit: Unit;
  presetId?: string;
  theme?: Theme;
  background?: Fill;
  locale?: string;
  /** Injectable for tests. */
  now?: number;
}

export const DEFAULT_DESIGN_NAME = 'Untitled design';

/** Trims a design name and keeps it within the allowed length. */
export function cleanDesignName(name: string, fallback: string = DEFAULT_DESIGN_NAME): string {
  const trimmed = name.trim() || fallback;
  return trimmed.slice(0, MAX_NAME_LENGTH);
}

/** Creates a new single-page design with a white background. */
export function createDesign(input: CreateDesignInput): Design {
  const now = input.now ?? Date.now();
  const design: Design = {
    id: uuidv7(now),
    schemaVersion: SCHEMA_VERSION,
    name: cleanDesignName(input.name),
    createdAt: now,
    updatedAt: now,
    width: input.width,
    height: input.height,
    unit: input.unit,
    bleed: 0,
    theme: structuredClone(input.theme ?? DEFAULT_THEME),
    pages: [
      {
        id: uuidv7(now),
        background: structuredClone(input.background ?? { type: 'solid', color: '#ffffff' }),
        elements: [],
      },
    ],
    meta: {},
  };
  if (input.presetId) design.presetId = input.presetId;
  if (input.locale) design.meta.locale = input.locale;
  return design;
}

/** Copies a design under a new ID and name. The copy is never in "Recently deleted". */
export function duplicateDesign(source: Design, options: { name: string; now?: number }): Design {
  const now = options.now ?? Date.now();
  const copy = structuredClone(source);
  copy.id = uuidv7(now);
  copy.name = cleanDesignName(options.name, source.name);
  copy.createdAt = now;
  copy.updatedAt = now;
  delete copy.deletedAt;
  copy.pages = copy.pages.map((page) => ({ ...page, id: uuidv7(now) }));
  return copy;
}
