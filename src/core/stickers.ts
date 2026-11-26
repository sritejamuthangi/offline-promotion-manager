import type { StickerName } from './schema';

/**
 * Decorative sticker silhouettes drawn in a 100 × 100 box. They are plain SVG paths,
 * so the same artwork renders in the editor, thumbnails and (later) print output.
 */
const PATHS: Record<StickerName, string> = {
  heart:
    'M50 88 C24 69 7 51 7 31 C7 17 18 7 32 7 C40 7 47 12 50 20 C53 12 60 7 68 7 C82 7 93 17 93 31 C93 51 76 69 50 88 Z',
  star: radialPath(5, 45, 19),
  burst: radialPath(12, 49, 34),
  badge: radialPath(16, 47, 40),
  speech:
    'M14 9 H86 C93 9 97 13 97 20 V60 C97 67 93 71 86 71 H58 L38 92 V71 H14 C7 71 3 67 3 60 V20 C3 13 7 9 14 9 Z',
  arrow: 'M4 38 H58 V16 L97 50 L58 84 V62 H4 Z',
  ribbon: 'M7 21 H93 V61 H62 L50 80 L38 61 H7 Z',
  sun:
    'M50 30 A20 20 0 1 0 50 70 A20 20 0 1 0 50 30 Z ' +
    'M46 1 H54 V15 H46 Z M46 85 H54 V99 H46 Z M1 46 H15 V54 H1 Z M85 46 H99 V54 H85 Z ' +
    'M70 7 L93 30 L85 38 L62 15 Z M93 70 L70 93 L62 85 L85 62 Z ' +
    'M30 93 L7 70 L15 62 L38 85 Z M7 30 L30 7 L38 15 L15 38 Z',
  cloud:
    'M28 82 C14 82 4 71 4 58 C4 45 14 35 27 35 C31 20 43 9 58 9 C74 9 87 21 89 37 C95 40 99 47 99 55 C99 70 88 82 74 82 Z',
  leaf: 'M51 5 C79 18 92 45 89 76 C62 76 34 60 19 31 C13 19 9 10 6 4 C23 7 39 1 51 5 Z',
  crown: 'M9 82 L4 20 L30 41 L50 9 L70 41 L96 20 L91 82 Z',
  sparkle: 'M50 2 C55 33 67 45 98 50 C67 55 55 67 50 98 C45 67 33 55 2 50 C33 45 45 33 50 2 Z',
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Alternating outer/inner points around the centre, used for stars and rosettes. */
function radialPath(points: number, outer: number, inner: number): string {
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const radius = i % 2 === 0 ? outer : inner;
    coords.push(`${round(50 + radius * Math.cos(angle))} ${round(50 + radius * Math.sin(angle))}`);
  }
  return `M${coords.join(' L')} Z`;
}

export function stickerPath(name: StickerName): string {
  return PATHS[name];
}
