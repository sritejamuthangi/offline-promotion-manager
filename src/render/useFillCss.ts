import type { CSSProperties } from 'react';
import type { Fill, Theme } from '@/core/schema';
import { useAssetUrl } from './assetUrl';
import { fillToCss } from './fill';

/** A fill as CSS, loading `asset:<id>` image fills from the local database. */
export function useFillCss(fill: Fill | undefined, theme: Theme): CSSProperties {
  const url = useAssetUrl(fill?.type === 'image' ? fill.src : undefined);
  return fillToCss(fill, theme, () => url);
}
