import { boundingRect, type Rect, unionRects } from './geometry';
import type { DesignElement } from './schema';

export const ALIGNMENTS = ['left', 'center', 'right', 'top', 'middle', 'bottom'] as const;
export type Alignment = (typeof ALIGNMENTS)[number];
export type LayerMove = 'forward' | 'backward' | 'front' | 'back';

/** Rotated outlines are aligned, rather than their unrotated frames. */
export function alignmentOffsets(elements: DesignElement[], alignment: Alignment, target?: Rect) {
  const bounds = elements.map(boundingRect);
  const area = target ?? unionRects(bounds);
  if (!area) return [];
  return bounds.map((b) => {
    switch (alignment) {
      case 'left':
        return { x: area.x - b.x, y: 0 };
      case 'center':
        return { x: area.x + area.width / 2 - b.x - b.width / 2, y: 0 };
      case 'right':
        return { x: area.x + area.width - b.x - b.width, y: 0 };
      case 'top':
        return { x: 0, y: area.y - b.y };
      case 'middle':
        return { x: 0, y: area.y + area.height / 2 - b.y - b.height / 2 };
      case 'bottom':
        return { x: 0, y: area.y + area.height - b.y - b.height };
      default:
        throw new Error(`Unknown alignment: ${alignment satisfies never}`);
    }
  });
}

/** Equal gaps between rotated bounds; the two outside elements stay put. */
export function distributionOffsets(elements: DesignElement[], axis: 'x' | 'y') {
  if (elements.length < 3) return elements.map(() => ({ x: 0, y: 0 }));
  const size = axis === 'x' ? 'width' : 'height';
  const ordered = elements
    .map((e, index) => ({ bounds: boundingRect(e), index }))
    .sort((a, b) => a.bounds[axis] - b.bounds[axis]);
  const first = ordered[0];
  const last = ordered.at(-1);
  if (!first || !last) return [];
  const space = last.bounds[axis] + last.bounds[size] - first.bounds[axis];
  const total = ordered.reduce((sum, item) => sum + item.bounds[size], 0);
  const gap = (space - total) / (ordered.length - 1);
  const offsets = elements.map(() => ({ x: 0, y: 0 }));
  let cursor = first.bounds[axis];
  for (const item of ordered) {
    const offset = offsets[item.index];
    if (offset) offset[axis] = cursor - item.bounds[axis];
    cursor += item.bounds[size] + gap;
  }
  return offsets;
}

/** Reorders selected layers as a stable group (array order is back to front). */
export function reorderLayers<T extends { id: string }>(
  elements: readonly T[],
  ids: readonly string[],
  move: LayerMove,
): T[] {
  const selected = new Set(ids);
  if (move === 'front')
    return [
      ...elements.filter((e) => !selected.has(e.id)),
      ...elements.filter((e) => selected.has(e.id)),
    ];
  if (move === 'back')
    return [
      ...elements.filter((e) => selected.has(e.id)),
      ...elements.filter((e) => !selected.has(e.id)),
    ];
  const result = [...elements];
  const swap = (a: number, b: number) => {
    const left = result[a];
    const right = result[b];
    if (left && right && selected.has(left.id) && !selected.has(right.id)) {
      result[a] = right;
      result[b] = left;
    }
  };
  if (move === 'forward') {
    for (let i = result.length - 2; i >= 0; i--) swap(i, i + 1);
  } else {
    for (let i = 1; i < result.length; i++) swap(i, i - 1);
  }
  return result;
}
