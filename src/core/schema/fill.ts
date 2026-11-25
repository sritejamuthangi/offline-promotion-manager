import { z } from 'zod';
import { ColorValueSchema } from './primitives';

export const GradientStopSchema = z.object({
  /** Position along the gradient, 0 to 1. */
  offset: z.number().min(0).max(1),
  color: ColorValueSchema,
});
export type GradientStop = z.infer<typeof GradientStopSchema>;

export const SolidFillSchema = z.object({
  type: z.literal('solid'),
  color: ColorValueSchema,
});

export const LinearFillSchema = z.object({
  type: z.literal('linear'),
  /** CSS angle in degrees: 0 points up, 90 points right. */
  angle: z.number(),
  stops: z.array(GradientStopSchema).min(2),
});

export const RadialFillSchema = z.object({
  type: z.literal('radial'),
  /** Centre of the gradient as a fraction of the box, 0 to 1. */
  cx: z.number().min(0).max(1),
  cy: z.number().min(0).max(1),
  stops: z.array(GradientStopSchema).min(2),
});

export const ImageFillSchema = z.object({
  type: z.literal('image'),
  /** `asset:<id>` for images stored on this device, or a path to a bundled image. */
  src: z.string().min(1),
  fit: z.enum(['cover', 'contain', 'tile']),
  opacity: z.number().min(0).max(1).optional(),
});

export const FillSchema = z.discriminatedUnion('type', [
  SolidFillSchema,
  LinearFillSchema,
  RadialFillSchema,
  ImageFillSchema,
]);
export type Fill = z.infer<typeof FillSchema>;
