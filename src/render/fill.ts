import type { CSSProperties } from 'react';
import { type Fill, type GradientStop, resolveColor, type Theme } from '@/core/schema';

function gradientStops(stops: readonly GradientStop[], theme: Theme): string {
  return stops
    .map((stop) => `${resolveColor(stop.color, theme)} ${roundPercent(stop.offset)}%`)
    .join(', ');
}

function roundPercent(fraction: number): number {
  return Math.round(fraction * 10_000) / 100;
}

/** Quotes a URL for CSS `url("...")` so it cannot break out of the declaration. */
export function cssUrl(url: string): string {
  return `url("${url.replace(/[\\"\n\r\f]/g, (ch) => `\\${ch.charCodeAt(0).toString(16)} `)}")`;
}

/**
 * Converts a fill into CSS background properties. Colours are validated hex values or
 * theme tokens, so the output is always safe to put in a style attribute.
 * `resolveSrc` turns an image reference (`asset:<id>`, bundled path) into a usable URL.
 */
export function fillToCss(
  fill: Fill | undefined,
  theme: Theme,
  resolveSrc?: (src: string) => string | undefined,
): CSSProperties {
  if (!fill) return {};
  switch (fill.type) {
    case 'solid':
      return { backgroundColor: resolveColor(fill.color, theme) };
    case 'linear':
      return {
        backgroundImage: `linear-gradient(${fill.angle}deg, ${gradientStops(fill.stops, theme)})`,
      };
    case 'radial':
      return {
        backgroundImage: `radial-gradient(circle at ${roundPercent(fill.cx)}% ${roundPercent(fill.cy)}%, ${gradientStops(fill.stops, theme)})`,
      };
    case 'image': {
      const url = resolveSrc?.(fill.src);
      if (!url) return {};
      const tile = fill.fit === 'tile';
      return {
        backgroundImage: cssUrl(url),
        backgroundSize: tile ? 'auto' : fill.fit,
        backgroundRepeat: tile ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center',
      };
    }
  }
}
