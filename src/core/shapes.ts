import type { Point } from './geometry';
import type { ShapeKind } from './schema';

/**
 * Corner points of polygon shapes inside a `width × height` box, inset by `inset` px so a
 * stroke of twice that width stays inside the box. Rectangles and ellipses are drawn natively
 * and return null.
 */
export function shapePoints(
  kind: ShapeKind,
  width: number,
  height: number,
  inset = 0,
): Point[] | null {
  const w = Math.max(width - inset * 2, 0);
  const h = Math.max(height - inset * 2, 0);
  const at = (fx: number, fy: number): Point => ({ x: inset + fx * w, y: inset + fy * h });
  switch (kind) {
    case 'rect':
    case 'ellipse':
      return null;
    case 'triangle':
      return [at(0.5, 0), at(1, 1), at(0, 1)];
    case 'diamond':
      return [at(0.5, 0), at(1, 0.5), at(0.5, 1), at(0, 0.5)];
    case 'pentagon':
      return regularPolygon(5, inset, w, h);
    case 'hexagon':
      return regularPolygon(6, inset, w, h);
    case 'star':
      return star(5, 0.5, inset, w, h);
  }
}

/** Polygon with equal sides, inscribed in the box, with a point at the top. */
function regularPolygon(sides: number, inset: number, w: number, h: number): Point[] {
  return Array.from({ length: sides }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
    return {
      x: inset + w / 2 + (w / 2) * Math.cos(angle),
      y: inset + h / 2 + (h / 2) * Math.sin(angle),
    };
  });
}

function star(points: number, innerRatio: number, inset: number, w: number, h: number): Point[] {
  return Array.from({ length: points * 2 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 === 0 ? 1 : innerRatio;
    return {
      x: inset + w / 2 + (w / 2) * r * Math.cos(angle),
      y: inset + h / 2 + (h / 2) * r * Math.sin(angle),
    };
  });
}

export function pointsToSvg(points: readonly Point[]): string {
  return points.map((p) => `${round(p.x)},${round(p.y)}`).join(' ');
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
