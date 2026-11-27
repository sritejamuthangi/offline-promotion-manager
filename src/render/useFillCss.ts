import type { CSSProperties } from 'react';
import type { Fill, Theme } from '@/core/schema';
import { fillToCss } from './fill';
import { useImageSrc } from './imageSource';

/**
 * A fill as CSS, loading `asset:<id>` image fills from the local database and drawing
 * `library:<id>` graphics in the theme colours. `frame` is the size of the filled box;
 * `resolveSrc` can supply ready URLs instead (image exports embed every image).
 */
export function useFillCss(
  fill: Fill | undefined,
  theme: Theme,
  frame?: { width: number; height: number },
  resolveSrc?: (source: string) => string | undefined,
): CSSProperties {
  const url = useImageSrc(fill?.type === 'image' ? fill.src : undefined, theme, frame);
  return fillToCss(fill, theme, (src) => resolveSrc?.(src) ?? url);
}
