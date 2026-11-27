import { PX_PER_INCH } from '../units';
import type { Size } from './layout';

/** Browsers refuse canvases wider or taller than this. */
export const MAX_CANVAS_SIDE = 16_384;
/** Phones and tablets often cap a canvas at 16.7 megapixels. */
export const MOBILE_MAX_PIXELS = 16_777_216;
export const DESKTOP_MAX_PIXELS = 50_000_000;

export interface RasterSize {
  width: number;
  height: number;
  /** Resolution actually used: lower than requested when the image would be too large. */
  dpi: number;
  reduced: boolean;
}

/** Pixel size of an export at `dpi`, reduced to stay within the browser's canvas limits. */
export function rasterSize(size: Size, dpi: number, maxPixels: number): RasterSize {
  const width = (size.width / PX_PER_INCH) * dpi;
  const height = (size.height / PX_PER_INCH) * dpi;
  const factor = Math.min(
    1,
    Math.sqrt(maxPixels / (width * height)),
    MAX_CANVAS_SIDE / width,
    MAX_CANVAS_SIDE / height,
  );
  const reduced = factor < 1;
  const effective = reduced ? Math.max(1, Math.floor(dpi * factor * 10) / 10) : dpi;
  const round = reduced ? Math.floor : Math.round;
  return {
    width: Math.max(1, round((size.width / PX_PER_INCH) * effective)),
    height: Math.max(1, round((size.height / PX_PER_INCH) * effective)),
    dpi: effective,
    reduced,
  };
}
