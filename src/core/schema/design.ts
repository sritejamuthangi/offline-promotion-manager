import { z } from 'zod';
import { ElementSchema } from './elements';
import { FillSchema } from './fill';
import { UnitSchema } from './primitives';
import { ThemeSchema } from './theme';

/**
 * Version of the design file format. Bump it only together with a migration in
 * `migrations.ts`, so designs saved by older versions keep opening.
 */
export const SCHEMA_VERSION = 1;

/** Size limits in CSS px: about 0.26 mm up to about 26 m (large-format banners). */
export const MIN_DESIGN_PX = 1;
export const MAX_DESIGN_PX = 100_000;

export const MAX_NAME_LENGTH = 200;

export const PageSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(200).optional(),
  background: FillSchema,
  /** Drawn in order: the first element is at the back, the last at the front. */
  elements: z.array(ElementSchema),
});
export type Page = z.infer<typeof PageSchema>;

export const DesignMetaSchema = z.object({
  /** The template this design started from, if any. */
  templateId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  /** Locale the design was created in, used for locale-aware defaults. */
  locale: z.string().optional(),
});

const designDimension = z.number().min(MIN_DESIGN_PX).max(MAX_DESIGN_PX);

export const DesignSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(SCHEMA_VERSION),
  name: z.string().max(MAX_NAME_LENGTH),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  /** Set when the design is moved to "Recently deleted". */
  deletedAt: z.number().int().nonnegative().optional(),
  /** Page size in CSS px. */
  width: designDimension,
  height: designDimension,
  /** Unit the person chose; used for showing sizes. */
  unit: UnitSchema,
  presetId: z.string().optional(),
  /** Extra artwork beyond the trim edge for professional printing, in CSS px. */
  bleed: z.number().min(0),
  theme: ThemeSchema,
  pages: z.array(PageSchema).min(1),
  meta: DesignMetaSchema,
});
export type Design = z.infer<typeof DesignSchema>;
