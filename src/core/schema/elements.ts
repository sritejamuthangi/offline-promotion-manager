import { z } from 'zod';
import { FillSchema } from './fill';
import { ColorValueSchema, FontValueSchema } from './primitives';

/**
 * Fields shared by every element. Geometry is in CSS px (1/96 in), measured from the
 * top-left corner of the page; `rotation` is in degrees around the element's centre.
 */
const elementBase = {
  id: z.string().min(1),
  name: z.string().max(200).optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number(),
  opacity: z.number().min(0).max(1),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  /** Marks content that people using this design as a template are expected to replace. */
  placeholder: z.boolean().optional(),
};

export const StrokeSchema = z.object({
  color: ColorValueSchema,
  width: z.number().min(0),
  dash: z.enum(['solid', 'dashed', 'dotted']).optional(),
});
export type Stroke = z.infer<typeof StrokeSchema>;

export const ShadowSchema = z.object({
  color: ColorValueSchema,
  blur: z.number().min(0),
  offsetX: z.number(),
  offsetY: z.number(),
});
export type Shadow = z.infer<typeof ShadowSchema>;

export const TextStyleSchema = z.object({
  fontFamily: FontValueSchema,
  /** Font size in CSS px. */
  fontSize: z.number().positive(),
  fontWeight: z.number().int().min(100).max(900),
  italic: z.boolean().optional(),
  color: ColorValueSchema,
  /** Logical alignment so right-to-left scripts align naturally. */
  align: z.enum(['start', 'center', 'end', 'justify']),
  verticalAlign: z.enum(['top', 'middle', 'bottom']),
  /** Multiple of the font size. */
  lineHeight: z.number().positive(),
  /** Extra space between letters, in em. */
  letterSpacing: z.number(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  underline: z.boolean().optional(),
  strikethrough: z.boolean().optional(),
  stroke: StrokeSchema.optional(),
  shadow: ShadowSchema.optional(),
});
export type TextStyle = z.infer<typeof TextStyleSchema>;

export const TextElementSchema = z.object({
  ...elementBase,
  type: z.literal('text'),
  text: z.string(),
  style: TextStyleSchema,
  /** Shrink the font until the text fits inside the box. */
  autoFit: z.boolean().optional(),
  direction: z.enum(['auto', 'ltr', 'rtl']).optional(),
});
export type TextElement = z.infer<typeof TextElementSchema>;

export const ImageElementSchema = z.object({
  ...elementBase,
  type: z.literal('image'),
  /** `asset:<id>` for images stored on this device, or a path to a bundled image. */
  src: z.string().min(1),
  alt: z.string().optional(),
  fit: z.enum(['cover', 'contain', 'fill']),
  /** Visible part of the image as fractions (0 to 1) of its natural size. */
  crop: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
      width: z.number().positive().max(1),
      height: z.number().positive().max(1),
    })
    .optional(),
  radius: z.number().min(0).optional(),
  flipX: z.boolean().optional(),
  flipY: z.boolean().optional(),
  stroke: StrokeSchema.optional(),
  shadow: ShadowSchema.optional(),
});
export type ImageElement = z.infer<typeof ImageElementSchema>;

export const SHAPE_KINDS = [
  'rect',
  'ellipse',
  'triangle',
  'diamond',
  'pentagon',
  'hexagon',
  'star',
] as const;
export type ShapeKind = (typeof SHAPE_KINDS)[number];

export const ShapeElementSchema = z.object({
  ...elementBase,
  type: z.literal('shape'),
  shape: z.enum(SHAPE_KINDS),
  fill: FillSchema,
  stroke: StrokeSchema.optional(),
  /** Corner radius in px (rectangles only). */
  radius: z.number().min(0).optional(),
  shadow: ShadowSchema.optional(),
});
export type ShapeElement = z.infer<typeof ShapeElementSchema>;

export const LINE_CAPS = ['none', 'arrow', 'circle', 'square'] as const;

export const LineElementSchema = z.object({
  ...elementBase,
  type: z.literal('line'),
  stroke: StrokeSchema,
  startCap: z.enum(LINE_CAPS),
  endCap: z.enum(LINE_CAPS),
});
export type LineElement = z.infer<typeof LineElementSchema>;

export const ElementSchema = z.discriminatedUnion('type', [
  TextElementSchema,
  ImageElementSchema,
  ShapeElementSchema,
  LineElementSchema,
]);
export type DesignElement = z.infer<typeof ElementSchema>;
export type ElementType = DesignElement['type'];
