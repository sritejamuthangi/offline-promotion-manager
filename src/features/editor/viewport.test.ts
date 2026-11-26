import { expect, it } from 'vitest';
import { fitView, MAX_ZOOM, MIN_ZOOM, pagePoint, zoomView } from './viewport';

it('fits tiny labels and giant posters inside desktop and phone viewports', () => {
  for (const viewport of [
    { width: 390, height: 500 },
    { width: 1200, height: 800 },
  ]) {
    for (const page of [
      { width: 1, height: 1 },
      { width: 100_000, height: 100_000 },
      { width: 794, height: 1123 },
    ]) {
      const view = fitView(viewport, page);
      expect(view.x).toBeGreaterThanOrEqual(40);
      expect(view.y).toBeGreaterThanOrEqual(40);
      expect(view.x * 2 + page.width * view.zoom).toBeCloseTo(viewport.width);
      expect(view.y * 2 + page.height * view.zoom).toBeCloseTo(viewport.height);
    }
  }
});

it('preserves the document coordinate beneath the cursor, including clamped zooms', () => {
  const view = { x: -150, y: 90, zoom: 0.7 };
  const cursor = { x: 210, y: 300 };
  const fixed = pagePoint(cursor, view);
  for (const zoom of [MIN_ZOOM / 2, 0.5, 2, MAX_ZOOM * 2]) {
    const next = zoomView(view, cursor, zoom);
    expect(next.zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
    expect(next.zoom).toBeLessThanOrEqual(MAX_ZOOM);
    expect(pagePoint(cursor, next).x).toBeCloseTo(fixed.x);
    expect(pagePoint(cursor, next).y).toBeCloseTo(fixed.y);
  }
});
