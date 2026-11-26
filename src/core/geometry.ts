/**
 * 2D geometry for the editor. Coordinates are CSS px on the page, y grows downwards and
 * positive angles turn clockwise (the same conventions as CSS `rotate()`).
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** An element's frame: a rectangle rotated by `rotation` degrees around its centre. */
export interface Box extends Rect {
  rotation: number;
}

const RAD_PER_DEG = Math.PI / 180;

export function rotatePoint(point: Point, pivot: Point, degrees: number): Point {
  if (degrees % 360 === 0) return { x: point.x, y: point.y };
  const angle = degrees * RAD_PER_DEG;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return { x: pivot.x + dx * cos - dy * sin, y: pivot.y + dx * sin + dy * cos };
}

export function centerOf(rect: Rect): Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Corners of a box after rotation, clockwise from the top-left. */
export function boxCorners(box: Box): [Point, Point, Point, Point] {
  const c = centerOf(box);
  const { x, y, width: w, height: h, rotation } = box;
  return [
    rotatePoint({ x, y }, c, rotation),
    rotatePoint({ x: x + w, y }, c, rotation),
    rotatePoint({ x: x + w, y: y + h }, c, rotation),
    rotatePoint({ x, y: y + h }, c, rotation),
  ];
}

/** Smallest upright rectangle that contains the rotated box. */
export function boundingRect(box: Box): Rect {
  if (box.rotation % 360 === 0) {
    return { x: box.x, y: box.y, width: box.width, height: box.height };
  }
  const corners = boxCorners(box);
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

export function unionRects(rects: readonly Rect[]): Rect | null {
  if (rects.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x <= b.x + b.width && b.x <= a.x + a.width && a.y <= b.y + b.height && b.y <= a.y + a.height
  );
}

/** Rectangle spanned by two points in any order (for marquee selection). */
export function rectFromPoints(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

/** Normalises an angle to the range (-180, 180]. */
export function normalizeAngle(degrees: number): number {
  let a = degrees % 360;
  if (a <= -180) a += 360;
  if (a > 180) a -= 360;
  return Object.is(a, -0) ? 0 : a;
}

/** Angle of the vector from `from` to `to`, in degrees (0 = right, 90 = down). */
export function angleBetween(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x) / RAD_PER_DEG;
}

/**
 * Snaps an angle. With `step`, it always snaps to multiples of the step (Shift key).
 * Otherwise it gently snaps to the nearest multiple of 45° within `tolerance` degrees.
 */
export function snapAngle(degrees: number, options: { step?: number; tolerance?: number } = {}) {
  if (options.step) return normalizeAngle(Math.round(degrees / options.step) * options.step);
  const tolerance = options.tolerance ?? 3;
  const nearest = Math.round(degrees / 45) * 45;
  return normalizeAngle(Math.abs(nearest - degrees) <= tolerance ? nearest : degrees);
}

// ---------------------------------------------------------------------------------------------
// Resizing

/** A resize handle: -1 = left/top edge, 1 = right/bottom edge, 0 = not involved. */
export interface Handle {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
}

export const HANDLES = {
  nw: { x: -1, y: -1 },
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 },
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
} as const satisfies Record<string, Handle>;

export type HandleName = keyof typeof HANDLES;

export const isCornerHandle = (handle: Handle) => handle.x !== 0 && handle.y !== 0;

export interface ResizeOptions {
  /** Keep the width:height ratio. */
  keepAspect?: boolean;
  /** Resize symmetrically around the centre (Alt key). */
  fromCenter?: boolean;
  /** Smallest allowed width/height in px. */
  minSize?: number;
}

/**
 * Resizes a (possibly rotated) box by dragging one of its handles to `pointer`.
 * The opposite edge or corner stays fixed on the page, as people expect.
 */
export function resizeBox(start: Box, handle: Handle, pointer: Point, options: ResizeOptions = {}) {
  const min = options.minSize ?? 1;
  const c0 = centerOf(start);
  // Pointer in the box's own (unrotated) frame, relative to its centre.
  const local = rotatePoint(pointer, c0, -start.rotation);
  const lx = local.x - c0.x;
  const ly = local.y - c0.y;

  let left = -start.width / 2;
  let right = start.width / 2;
  let top = -start.height / 2;
  let bottom = start.height / 2;

  if (options.fromCenter) {
    if (handle.x !== 0) {
      const half = Math.max(lx * handle.x, min / 2);
      left = -half;
      right = half;
    }
    if (handle.y !== 0) {
      const half = Math.max(ly * handle.y, min / 2);
      top = -half;
      bottom = half;
    }
  } else {
    if (handle.x === 1) right = Math.max(lx, left + min);
    if (handle.x === -1) left = Math.min(lx, right - min);
    if (handle.y === 1) bottom = Math.max(ly, top + min);
    if (handle.y === -1) top = Math.min(ly, bottom - min);
  }

  let width = right - left;
  let height = bottom - top;

  if (options.keepAspect && start.width > 0 && start.height > 0) {
    const ratio = start.width / start.height;
    if (isCornerHandle(handle)) {
      const scale = Math.max(
        width / start.width,
        height / start.height,
        min / start.width,
        min / start.height,
      );
      width = start.width * scale;
      height = start.height * scale;
      if (options.fromCenter) {
        left = -width / 2;
        top = -height / 2;
      } else {
        if (handle.x === 1) right = left + width;
        else left = right - width;
        if (handle.y === 1) bottom = top + height;
        else top = bottom - height;
      }
    } else if (handle.x !== 0) {
      width = Math.max(width, min * ratio);
      if (options.fromCenter) left = -width / 2;
      else if (handle.x === -1) left = right - width;
      height = width / ratio;
      top = -height / 2;
    } else {
      height = Math.max(height, min / ratio);
      if (options.fromCenter) top = -height / 2;
      else if (handle.y === -1) top = bottom - height;
      width = height * ratio;
      left = -width / 2;
    }
  }

  const localCenter = { x: c0.x + left + width / 2, y: c0.y + top + height / 2 };
  const center = rotatePoint(localCenter, c0, start.rotation);
  return {
    x: center.x - width / 2,
    y: center.y - height / 2,
    width,
    height,
    rotation: start.rotation,
  };
}

/** Uniformly scales several boxes away from the corner opposite `handle` of their bounds. */
export function scaleBoxes(
  boxes: readonly Box[],
  bounds: Rect,
  handle: Handle,
  pointer: Point,
  minScale = 0.01,
): { boxes: Box[]; scale: number } {
  const anchor = {
    x: handle.x === 1 ? bounds.x : bounds.x + bounds.width,
    y: handle.y === 1 ? bounds.y : bounds.y + bounds.height,
  };
  const sx = handle.x === 0 ? 0 : ((pointer.x - anchor.x) * handle.x) / bounds.width;
  const sy = handle.y === 0 ? 0 : ((pointer.y - anchor.y) * handle.y) / bounds.height;
  const scale = Math.max(sx, sy, minScale);
  return {
    scale,
    boxes: boxes.map((b) => {
      const c = centerOf(b);
      const nc = { x: anchor.x + (c.x - anchor.x) * scale, y: anchor.y + (c.y - anchor.y) * scale };
      const width = b.width * scale;
      const height = b.height * scale;
      return { x: nc.x - width / 2, y: nc.y - height / 2, width, height, rotation: b.rotation };
    }),
  };
}

/** Rotates several boxes together around `pivot`. */
export function rotateBoxes(boxes: readonly Box[], pivot: Point, delta: number): Box[] {
  return boxes.map((b) => {
    const c = rotatePoint(centerOf(b), pivot, delta);
    return {
      x: c.x - b.width / 2,
      y: c.y - b.height / 2,
      width: b.width,
      height: b.height,
      rotation: normalizeAngle(b.rotation + delta),
    };
  });
}

// ---------------------------------------------------------------------------------------------
// Lines are stored as boxes: the line runs through the middle, from the left to the right edge.

export function lineEndpoints(box: Box): { start: Point; end: Point } {
  const c = centerOf(box);
  return {
    start: rotatePoint({ x: box.x, y: c.y }, c, box.rotation),
    end: rotatePoint({ x: box.x + box.width, y: c.y }, c, box.rotation),
  };
}

export function boxFromLine(start: Point, end: Point, thickness: number, minLength = 1): Box {
  const length = Math.max(distance(start, end), minLength);
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  return {
    x: mid.x - length / 2,
    y: mid.y - thickness / 2,
    width: length,
    height: thickness,
    rotation: normalizeAngle(angleBetween(start, end)),
  };
}
