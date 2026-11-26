/** Small helpers for writing compact, deterministic SVG markup. */

export type Point = readonly [number, number];

/** Rounds to one decimal place (and never prints "-0"), keeping markup short and stable. */
export function n(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

/** Deterministic pseudo-random numbers (mulberry32): artwork is identical on every render. */
export function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Picks an item from a non-empty list with a random number in [0, 1). */
export function pick<T>(items: readonly [T, ...T[]], r: number): T {
  return items[Math.min(items.length - 1, Math.floor(r * items.length))] ?? items[0];
}

/** A smooth closed curve through the points (Catmull-Rom spline as cubic Béziers). */
export function smoothClosedPath(points: readonly Point[]): string {
  const count = points.length;
  const at = (i: number): Point => points[((i % count) + count) % count] ?? [0, 0];
  if (count < 3) return '';
  let d = `M${n(at(0)[0])} ${n(at(0)[1])}`;
  for (let i = 0; i < count; i++) {
    const [x0, y0] = at(i - 1);
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [x3, y3] = at(i + 2);
    d += `C${n(x1 + (x2 - x0) / 6)} ${n(y1 + (y2 - y0) / 6)} ${n(x2 - (x3 - x1) / 6)} ${n(y2 - (y3 - y1) / 6)} ${n(x2)} ${n(y2)}`;
  }
  return `${d}Z`;
}

/** An organic blob around a centre. `wobble` is the share of the radius that varies. */
export function blobPath(
  cx: number,
  cy: number,
  radius: number,
  seed: number,
  points = 8,
  wobble = 0.22,
): string {
  const rand = random(seed);
  const outline: Point[] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius * (1 - wobble + rand() * wobble * 2);
    outline.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  return smoothClosedPath(outline);
}

/** Point on a quadratic Bézier curve, with the tangent direction in degrees. */
export function quadraticAt(p0: Point, p1: Point, p2: Point, t: number) {
  const u = 1 - t;
  const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
  const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
  const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
  const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

/** A four-pointed sparkle with concave sides. */
export function sparklePath(cx: number, cy: number, r: number): string {
  const k = r * 0.12;
  return (
    `M${n(cx)} ${n(cy - r)}` +
    `C${n(cx + k)} ${n(cy - k)} ${n(cx + k)} ${n(cy - k)} ${n(cx + r)} ${n(cy)}` +
    `C${n(cx + k)} ${n(cy + k)} ${n(cx + k)} ${n(cy + k)} ${n(cx)} ${n(cy + r)}` +
    `C${n(cx - k)} ${n(cy + k)} ${n(cx - k)} ${n(cy + k)} ${n(cx - r)} ${n(cy)}` +
    `C${n(cx - k)} ${n(cy - k)} ${n(cx - k)} ${n(cy - k)} ${n(cx)} ${n(cy - r)}Z`
  );
}

/** Alternating outer and inner radii around a centre: stars, bursts and rosettes. */
export function radialPolygon(
  cx: number,
  cy: number,
  points: number,
  outer: number,
  inner: number,
  rotation = -90,
): string {
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = ((rotation + (i * 180) / points) * Math.PI) / 180;
    const r = i % 2 === 0 ? outer : inner;
    coords.push(`${n(cx + r * Math.cos(angle))} ${n(cy + r * Math.sin(angle))}`);
  }
  return `M${coords.join('L')}Z`;
}

/** A leaf shape pointing right from the origin, `length` long. */
export function leafPath(length: number, width: number): string {
  const h = width / 2;
  return `M0 0C${n(length * 0.3)} ${n(-h)} ${n(length * 0.75)} ${n(-h)} ${n(length)} 0C${n(length * 0.75)} ${n(h)} ${n(length * 0.3)} ${n(h)} 0 0Z`;
}
