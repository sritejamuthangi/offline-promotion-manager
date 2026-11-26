import type { ThemeColors } from '../palettes';
import { LIBRARY_GRAPHICS, type LibraryGraphic } from './graphics';

export {
  LIBRARY_CATEGORIES,
  LIBRARY_GRAPHICS,
  type LibraryCategory,
  type LibraryGraphic,
} from './graphics';

/**
 * Built-in graphics are referenced from designs as `library:<id>`. They are drawn on demand
 * from code with the design's own theme colours, so they work offline, cost no storage and
 * follow one-click palettes.
 */
export const LIBRARY_PREFIX = 'library:';

const BY_ID: ReadonlyMap<string, LibraryGraphic> = new Map(LIBRARY_GRAPHICS.map((g) => [g.id, g]));

export function librarySrc(id: string): string {
  return `${LIBRARY_PREFIX}${id}`;
}

export function libraryIdFromSrc(src: string | undefined): string | undefined {
  return src?.startsWith(LIBRARY_PREFIX) ? src.slice(LIBRARY_PREFIX.length) : undefined;
}

export function getLibraryGraphic(id: string): LibraryGraphic | undefined {
  return BY_ID.get(id);
}

/**
 * The drawing size for a graphic. Adaptive graphics take the frame's proportions, with the
 * longer side fixed at 1000 units, so a background exactly covers any page.
 */
export function librarySize(
  graphic: LibraryGraphic,
  frame?: { width: number; height: number },
): { width: number; height: number } {
  if (!graphic.adaptive || !frame || !(frame.width > 0) || !(frame.height > 0))
    return { width: graphic.width, height: graphic.height };
  const scale = 1000 / Math.max(frame.width, frame.height);
  return {
    width: Math.max(1, Math.round(frame.width * scale)),
    height: Math.max(1, Math.round(frame.height * scale)),
  };
}

/** Standalone SVG markup for a graphic drawn in the given colours. */
export function renderLibrarySvg(
  graphic: LibraryGraphic,
  colors: ThemeColors,
  frame?: { width: number; height: number },
): string {
  const { width, height } = librarySize(graphic, frame);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${graphic.draw({ c: colors, w: width, h: height })}</svg>`;
}
