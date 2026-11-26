import type { Rect } from './geometry';

/** Positions that moving or resizing elements snap to, in page px. */
export interface SnapTargets {
  x: number[];
  y: number[];
}

export interface SnapGuides {
  /** Vertical guide lines (x positions). */
  x: number[];
  /** Horizontal guide lines (y positions). */
  y: number[];
}

export const NO_GUIDES: SnapGuides = { x: [], y: [] };

/** Page edges and centre, plus the edges and centres of the other elements. */
export function collectSnapTargets(page: { width: number; height: number }, others: Rect[]) {
  const targets: SnapTargets = {
    x: [0, page.width / 2, page.width],
    y: [0, page.height / 2, page.height],
  };
  for (const r of others) {
    targets.x.push(r.x, r.x + r.width / 2, r.x + r.width);
    targets.y.push(r.y, r.y + r.height / 2, r.y + r.height);
  }
  return targets;
}

interface AxisSnap {
  offset: number;
  lines: number[];
}

/**
 * Finds the smallest shift (within `threshold`) that lines one of `candidates` up with one of
 * `targets`, and every target line that matches after that shift.
 */
export function snapAxis(
  candidates: readonly number[],
  targets: readonly number[],
  threshold: number,
): AxisSnap | null {
  let best: number | null = null;
  for (const c of candidates) {
    for (const t of targets) {
      const d = t - c;
      if (Math.abs(d) <= threshold && (best === null || Math.abs(d) < Math.abs(best))) best = d;
    }
  }
  if (best === null) return null;
  const offset = best;
  const lines = new Set<number>();
  for (const c of candidates) {
    for (const t of targets) {
      if (Math.abs(t - (c + offset)) < 0.5) lines.add(t);
    }
  }
  return { offset, lines: [...lines] };
}

/** Snaps a moving rectangle's edges and centre to the targets. */
export function snapRect(
  rect: Rect,
  targets: SnapTargets,
  threshold: number,
): { dx: number; dy: number; guides: SnapGuides } {
  const sx = snapAxis([rect.x, rect.x + rect.width / 2, rect.x + rect.width], targets.x, threshold);
  const sy = snapAxis(
    [rect.y, rect.y + rect.height / 2, rect.y + rect.height],
    targets.y,
    threshold,
  );
  return {
    dx: sx?.offset ?? 0,
    dy: sy?.offset ?? 0,
    guides: { x: sx?.lines ?? [], y: sy?.lines ?? [] },
  };
}
