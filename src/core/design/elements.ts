import { newId } from '../ids';
import type { Design, DesignElement, ShapeKind } from '../schema';

export type InsertKind = 'text' | 'line' | ShapeKind;

/** Sensible initial sizes, relative to the paper, even on tiny labels or large posters. */
export function createElement(kind: InsertKind, design: Design, text: string): DesignElement {
  const size = Math.min(design.width, design.height);
  const width = Math.max(1, size * (kind === 'text' ? 0.65 : 0.32));
  const height = Math.max(
    1,
    kind === 'line' ? size * 0.006 : kind === 'text' ? size * 0.14 : size * 0.25,
  );
  const base = {
    id: newId(),
    x: (design.width - width) / 2,
    y: (design.height - height) / 2,
    width,
    height,
    rotation: 0,
    opacity: 1,
  };
  if (kind === 'text')
    return {
      ...base,
      type: 'text',
      text,
      direction: 'auto',
      style: {
        fontFamily: '$heading',
        fontSize: size * 0.06,
        fontWeight: 700,
        color: '$text',
        align: 'center',
        verticalAlign: 'middle',
        lineHeight: 1.2,
        letterSpacing: 0,
      },
    };
  if (kind === 'line')
    return {
      ...base,
      type: 'line',
      stroke: { color: '$primary', width: height },
      startCap: 'none',
      endCap: 'none',
    };
  return { ...base, type: 'shape', shape: kind, fill: { type: 'solid', color: '$primary' } };
}
