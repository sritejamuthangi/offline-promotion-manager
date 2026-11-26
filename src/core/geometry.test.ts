import { describe, expect, it } from 'vitest';
import {
  boundingRect,
  boxCorners,
  boxFromLine,
  centerOf,
  HANDLES,
  lineEndpoints,
  type Point,
  resizeBox,
  rotateBoxes,
  rotatePoint,
  scaleBoxes,
  snapAngle,
} from './geometry';
import { collectSnapTargets, snapRect } from './snapping';

const near = (a: Point, b: Point) => {
  expect(a.x).toBeCloseTo(b.x, 8);
  expect(a.y).toBeCloseTo(b.y, 8);
};

describe('rotation-aware editing geometry', () => {
  it('keeps the opposite corner fixed when resizing at any rotation', () => {
    for (const rotation of [0, 30, 90, 145, -70]) {
      const box = { x: 40, y: 60, width: 100, height: 80, rotation };
      const pointer = rotatePoint({ x: 200, y: 180 }, centerOf(box), rotation);
      const resized = resizeBox(box, HANDLES.se, pointer);
      near(boxCorners(resized)[0], boxCorners(box)[0]);
      near(boxCorners(resized)[2], pointer);
      expect(resized.width).toBeCloseTo(160);
      expect(resized.height).toBeCloseTo(120);
    }
  });

  it('keeps the centre and aspect ratio with Alt + Shift resizing', () => {
    const box = { x: 10, y: 30, width: 100, height: 50, rotation: 32 };
    const resized = resizeBox(
      box,
      HANDLES.nw,
      { x: -30, y: -70 },
      {
        fromCenter: true,
        keepAspect: true,
      },
    );
    near(centerOf(resized), centerOf(box));
    expect(resized.width / resized.height).toBeCloseTo(2);
  });

  it('clamps sizes instead of flipping when a handle crosses its anchor', () => {
    const box = { x: 0, y: 0, width: 100, height: 50, rotation: 0 };
    const resized = resizeBox(box, HANDLES.se, { x: -100, y: -100 }, { minSize: 4 });
    expect(resized).toMatchObject({ x: 0, y: 0, width: 4, height: 4 });
    const centered = resizeBox(box, HANDLES.e, { x: 0, y: 25 }, { fromCenter: true, minSize: 4 });
    expect(centered.width).toBe(4);
    const scaled = scaleBoxes([box], box, HANDLES.se, { x: -100, y: -50 });
    expect(scaled.scale).toBe(0.01);
  });

  it('rotates and uniformly scales a selection without changing relative positions', () => {
    const boxes = [
      { x: 0, y: 0, width: 40, height: 20, rotation: 0 },
      { x: 80, y: 20, width: 20, height: 30, rotation: 45 },
    ];
    const scaled = scaleBoxes(boxes, { x: 0, y: 0, width: 100, height: 50 }, HANDLES.se, {
      x: 200,
      y: 100,
    });
    expect(scaled.scale).toBe(2);
    expect(scaled.boxes[1]).toMatchObject({ x: 160, y: 40, width: 40, height: 60, rotation: 45 });
    const rotated = rotateBoxes(boxes, { x: 0, y: 0 }, 90);
    const first = rotated[0];
    if (!first) throw new Error('Missing rotated box');
    near(centerOf(first), { x: -10, y: 20 });
    expect(rotated[1]?.rotation).toBe(135);
  });

  it('calculates rotated bounds and angle snapping', () => {
    const bounds = boundingRect({ x: 0, y: 0, width: 100, height: 40, rotation: 90 });
    expect(bounds.x).toBeCloseTo(30);
    expect(bounds.width).toBeCloseTo(40);
    expect(bounds.height).toBeCloseTo(100);
    expect(snapAngle(88)).toBe(90);
    expect(snapAngle(82)).toBe(82);
    expect(snapAngle(82, { step: 15 })).toBe(75);
  });

  it('preserves line endpoints through conversion', () => {
    const start = { x: 12, y: 44 };
    const end = { x: 130, y: -50 };
    const points = lineEndpoints(boxFromLine(start, end, 4));
    near(points.start, start);
    near(points.end, end);
  });
});

describe('alignment guides', () => {
  it('snaps to the closest page/element edge and centre within the threshold', () => {
    const targets = collectSnapTargets({ width: 800, height: 1000 }, [
      { x: 100, y: 100, width: 100, height: 80 },
    ]);
    const result = snapRect({ x: 97, y: 397, width: 100, height: 200 }, targets, 6);
    expect(result).toEqual({ dx: 3, dy: 3, guides: { x: [100, 150, 200], y: [500] } });
    expect(snapRect({ x: 300, y: 300, width: 20, height: 20 }, targets, 6).guides).toEqual({
      x: [],
      y: [],
    });
  });
});
