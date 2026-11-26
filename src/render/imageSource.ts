import {
  getLibraryGraphic,
  libraryIdFromSrc,
  librarySize,
  renderLibrarySvg,
} from '@/content/library';
import type { Theme } from '@/core/schema';
import { useAssetUrl } from './assetUrl';

const MAX_CACHED = 300;
const cache = new Map<string, string>();

/**
 * A data URL for a built-in graphic in the given colours. URLs are cached, so redrawing
 * the same graphic (thumbnails, re-renders) costs nothing.
 */
export function libraryImageUrl(
  id: string,
  colors: Theme['colors'],
  frame?: { width: number; height: number },
): string | undefined {
  const graphic = getLibraryGraphic(id);
  if (!graphic) return undefined;
  const size = librarySize(graphic, frame);
  const key = `${id}|${Object.values(colors).join(',')}|${size.width}x${size.height}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderLibrarySvg(graphic, colors, size))}`;
  if (cache.size >= MAX_CACHED) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, url);
  return url;
}

/**
 * Resolves any image reference in a design to a URL the browser can show:
 * `asset:<id>` from the local database, `library:<id>` drawn with the theme colours,
 * and bundled paths unchanged. `frame` lets backgrounds match the shape they fill.
 */
export function useImageSrc(
  src: string | undefined,
  theme: Theme,
  frame?: { width: number; height: number },
): string | undefined {
  const assetUrl = useAssetUrl(src);
  const libraryId = libraryIdFromSrc(src);
  if (libraryId) return libraryImageUrl(libraryId, theme.colors, frame);
  return assetUrl;
}
