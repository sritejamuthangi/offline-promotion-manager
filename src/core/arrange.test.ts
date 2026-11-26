import { expect, it } from 'vitest';
import { alignmentOffsets, distributionOffsets, reorderLayers } from './arrange';
import type { ShapeElement } from './schema';

const element = (x: number, width: number, rotation = 0): ShapeElement => ({
  id: String(x),
  x,
  y: 10,
  width,
  height: 40,
  rotation,
  opacity: 1,
  type: 'shape',
  shape: 'rect',
  fill: { type: 'solid', color: '#000000' },
});

it('aligns rotated visible bounds to page edges or a selection', () => {
  const items = [element(10, 100), element(200, 100, 90)];
  expect(alignmentOffsets(items, 'left')[1]?.x).toBeCloseTo(-220);
  expect(
    alignmentOffsets([element(10, 100)], 'center', { x: 0, y: 0, width: 800, height: 600 })[0]?.x,
  ).toBe(340);
});

it('distributes unequal widths with equal gaps, preserving outside positions', () => {
  const offsets = distributionOffsets([element(0, 100), element(120, 50), element(400, 80)], 'x');
  expect(offsets.map((p) => p.x)).toEqual([0, 105, 0]);
});

it('moves multiple layers one step while preserving their internal order', () => {
  const items = 'abcde'.split('').map((id) => ({ id }));
  const order = (move: Parameters<typeof reorderLayers>[2]) =>
    reorderLayers(items, ['b', 'c'], move)
      .map((e) => e.id)
      .join('');
  expect(order('forward')).toBe('adbce');
  expect(order('backward')).toBe('bcade');
  expect(order('front')).toBe('adebc');
  expect(order('back')).toBe('bcade');
});
