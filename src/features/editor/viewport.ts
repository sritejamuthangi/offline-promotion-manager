import type { Point } from '@/core/geometry';

export interface View {
  x: number;
  y: number;
  zoom: number;
}
export const MIN_ZOOM = 0.0001;
export const MAX_ZOOM = 8;
export const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

export function fitView(
  viewport: { width: number; height: number },
  page: { width: number; height: number },
): View {
  const zoom = clampZoom(
    Math.min(
      Math.max(1, viewport.width - 80) / page.width,
      Math.max(1, viewport.height - 80) / page.height,
      1,
    ),
  );
  return {
    zoom,
    x: (viewport.width - page.width * zoom) / 2,
    y: (viewport.height - page.height * zoom) / 2,
  };
}
export function pagePoint(screen: Point, view: View): Point {
  return { x: (screen.x - view.x) / view.zoom, y: (screen.y - view.y) / view.zoom };
}
/** Zooms around the cursor without moving the artwork underneath it. */
export function zoomView(view: View, point: Point, zoom: number): View {
  const fixed = pagePoint(point, view);
  const next = clampZoom(zoom);
  return { zoom: next, x: point.x - fixed.x * next, y: point.y - fixed.y * next };
}
