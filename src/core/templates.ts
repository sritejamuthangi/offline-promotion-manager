import { cleanDesignName } from './design/factory';
import { uuidv7 } from './ids';
import type { PaperFamily } from './locale';
import { getPreset, type PresetId, presetSizePx } from './paper';
import {
  type Design,
  type DesignElement,
  type Fill,
  type Page,
  SCHEMA_VERSION,
  type Theme,
} from './schema';
import type { Unit } from './units';

export const TEMPLATE_CATEGORIES = [
  'business',
  'events',
  'education',
  'greetings',
  'food',
  'signs',
  'social',
] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

/** One page of template content. IDs only need to be unique within the template. */
export interface TemplatePage {
  name?: string;
  background: Fill;
  elements: DesignElement[];
}

/**
 * A bundled template. Layouts are functions of the page size, so the same template fits
 * A4 and US Letter (and their poster, flyer and card sizes) without stretching anything.
 * Colours and fonts should use theme slots (`$primary`, `$heading`...), so one-click
 * styles restyle the whole template.
 */
export interface TemplateDefinition {
  readonly id: string;
  /** English name, also used for designs made from the template. */
  readonly name: string;
  /** Public description, shared by the catalogue, template page and search metadata. */
  readonly description: string;
  readonly category: TemplateCategory;
  /** Extra search words (English). */
  readonly tags: readonly string[];
  /** The size preset for each paper family (they can be the same, e.g. social posts). */
  readonly size: { readonly a4: PresetId; readonly letter: PresetId };
  readonly theme: Theme;
  readonly build: (page: { width: number; height: number }) => TemplatePage[];
}

export interface TemplateSize {
  presetId: PresetId;
  /** CSS px. */
  width: number;
  height: number;
  unit: Unit;
}

export function templateSize(template: TemplateDefinition, paper: PaperFamily): TemplateSize {
  const presetId = template.size[paper];
  const preset = getPreset(presetId);
  if (!preset) throw new RangeError(`Unknown size preset: ${presetId}`);
  return { presetId, unit: preset.unit, ...presetSizePx(preset) };
}

/** Copies pages with fresh IDs for every page, element and Smart Grid item. */
export function withFreshIds(pages: readonly TemplatePage[], now: number = Date.now()): Page[] {
  return pages.map((page) => ({
    ...(page.name ? { name: page.name } : {}),
    id: uuidv7(now),
    background: structuredClone(page.background),
    elements: page.elements.map((element): DesignElement => {
      const copy = structuredClone(element);
      copy.id = uuidv7(now);
      if (copy.type === 'grid')
        copy.items = copy.items.map((item) => ({ ...item, id: uuidv7(now) }));
      return copy;
    }),
  }));
}

/** Builds a new, editable design from a bundled template at the paper size people use. */
export function designFromTemplate(
  template: TemplateDefinition,
  options: { paper: PaperFamily; name?: string; now?: number; locale?: string },
): Design {
  const now = options.now ?? Date.now();
  const size = templateSize(template, options.paper);
  const design: Design = {
    id: uuidv7(now),
    schemaVersion: SCHEMA_VERSION,
    name: cleanDesignName(options.name ?? template.name),
    createdAt: now,
    updatedAt: now,
    width: size.width,
    height: size.height,
    unit: size.unit,
    presetId: size.presetId,
    bleed: 0,
    theme: structuredClone(template.theme),
    pages: withFreshIds(template.build(size), now),
    meta: { templateId: template.id },
  };
  if (options.locale) design.meta.locale = options.locale;
  return design;
}

/** The `meta.templateId` of designs made from a template someone saved on this device. */
export function savedTemplateRef(id: string): string {
  return `saved:${id}`;
}

/** Builds a new design from a design that was saved as a template. */
export function designFromSavedTemplate(
  source: Design,
  options: { templateId: string; name?: string; now?: number },
): Design {
  const now = options.now ?? Date.now();
  const design = structuredClone(source);
  design.id = uuidv7(now);
  design.name = cleanDesignName(options.name ?? source.name, source.name);
  design.createdAt = now;
  design.updatedAt = now;
  delete design.deletedAt;
  design.pages = withFreshIds(source.pages, now);
  design.meta = { ...design.meta, templateId: savedTemplateRef(options.templateId) };
  return design;
}

/** Case- and accent-insensitive search over names, categories and tags. */
export function matchesTemplateQuery(
  query: string,
  fields: readonly (string | undefined)[],
): boolean {
  const fold = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLocaleLowerCase();
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = fold(fields.filter(Boolean).join(' '));
  return words.every((word) => haystack.includes(word));
}
