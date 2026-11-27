/**
 * Resolution metadata for exported images, so other apps print a 300 DPI A4 export at
 * A4 size instead of guessing. Browsers' canvas encoders leave this out.
 */
import { crc32 } from '../crc32';

export { crc32 };

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

/** Adds (or replaces) the PNG `pHYs` chunk with the given resolution. */
export function setPngDpi(png: Uint8Array, dpi: number): Uint8Array {
  if (!PNG_SIGNATURE.every((byte, i) => png[i] === byte)) return png;
  const perMetre = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // pHYs
  view.setUint32(8, perMetre);
  view.setUint32(12, perMetre);
  chunk[16] = 1; // unit: metre
  view.setUint32(17, crc32(chunk, 4, 17));

  const source = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const parts: Uint8Array[] = [png.subarray(0, 8)];
  let offset = 8;
  while (offset + 12 <= png.length) {
    const end = offset + 12 + source.getUint32(offset);
    if (end > png.length) return png;
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
    if (type !== 'pHYs') parts.push(png.subarray(offset, end));
    if (type === 'IHDR') parts.push(chunk);
    offset = end;
    if (type === 'IEND') break;
  }
  return concat(parts);
}

/** Sets the JFIF density of a JPEG in dots per inch, adding a JFIF header if needed. */
export function setJpegDpi(jpeg: Uint8Array, dpi: number): Uint8Array {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return jpeg;
  const density = Math.min(65535, Math.max(1, Math.round(dpi)));
  const high = density >> 8;
  const low = density & 0xff;
  const jfif =
    jpeg[2] === 0xff &&
    jpeg[3] === 0xe0 &&
    String.fromCharCode(...jpeg.subarray(6, 11)) === 'JFIF\0' &&
    jpeg.length > 17;
  if (jfif) {
    const copy = jpeg.slice();
    copy.set([1, high, low, high, low], 13);
    return copy;
  }
  const app0 = new Uint8Array([
    0xff,
    0xe0,
    0x00,
    0x10,
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00,
    0x01,
    0x01,
    0x01,
    high,
    low,
    high,
    low,
    0x00,
    0x00,
  ]);
  return concat([jpeg.subarray(0, 2), app0, jpeg.subarray(2)]);
}
