import type { ThemeColors } from '../palettes';
import {
  blobPath,
  leafPath,
  n,
  type Point,
  pick,
  quadraticAt,
  radialPolygon,
  random,
  smoothClosedPath,
  sparklePath,
} from './svg';

export const LIBRARY_CATEGORIES = [
  'backgrounds',
  'frames',
  'decorations',
  'illustrations',
] as const;
export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

export interface GraphicCanvas {
  /** The design's theme colours, so graphics restyle with one-click palettes. */
  c: ThemeColors;
  w: number;
  h: number;
}

export interface LibraryGraphic {
  readonly id: string;
  readonly category: LibraryCategory;
  /** Extra search words (English). */
  readonly tags: readonly string[];
  /** Natural size in SVG units. */
  readonly width: number;
  readonly height: number;
  /** Redrawn for the exact proportions of its frame, so pages of any shape are covered. */
  readonly adaptive?: boolean;
  readonly draw: (canvas: GraphicCanvas) => string;
}

const rect = (w: number, h: number, fill: string, extra = '') =>
  `<rect width="${n(w)}" height="${n(h)}" fill="${fill}"${extra}/>`;

const pattern = (w: number, h: number, size: [number, number], body: string, transform = '') =>
  `<defs><pattern id="p" width="${size[0]}" height="${size[1]}" patternUnits="userSpaceOnUse"${
    transform ? ` patternTransform="${transform}"` : ''
  }>${body}</pattern></defs>${rect(w, h, 'url(#p)')}`;

const polygon = (points: readonly Point[], fill: string, extra = '') =>
  `<polygon points="${points.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')}" fill="${fill}"${extra}/>`;

/** A sine-like band from `y` down to the bottom edge. */
function waveBand(
  w: number,
  h: number,
  y: number,
  amplitude: number,
  period: number,
  phase: number,
) {
  const steps = 96;
  let d = `M0 ${n(h)}`;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w;
    d += `L${n(x)} ${n(y + Math.sin((x / period) * Math.PI * 2 + phase) * amplitude)}`;
  }
  return `${d}L${n(w)} ${n(h)}Z`;
}

/** A ridge of mountains from fractional peak positions down to the bottom edge. */
function ridge(w: number, h: number, peaks: readonly Point[]) {
  return [[0, h] as Point, ...peaks.map(([fx, fy]) => [fx * w, fy * h] as Point), [w, h] as Point];
}

export const LIBRARY_GRAPHICS: readonly LibraryGraphic[] = [
  // Backgrounds: opaque, redrawn for every page shape.
  {
    id: 'dots',
    category: 'backgrounds',
    tags: ['polka', 'pattern', 'spots'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) =>
      rect(w, h, c.background) +
      pattern(
        w,
        h,
        [44, 44],
        `<circle cx="11" cy="11" r="5.5" fill="${c.primary}" fill-opacity=".2"/><circle cx="33" cy="33" r="5.5" fill="${c.primary}" fill-opacity=".2"/>`,
      ),
  },
  {
    id: 'grid-paper',
    category: 'backgrounds',
    tags: ['graph', 'pattern', 'squares', 'school'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) =>
      rect(w, h, c.background) +
      pattern(
        w,
        h,
        [50, 50],
        `<path d="M50 0H0V50" fill="none" stroke="${c.muted}" stroke-opacity=".22" stroke-width="1.5"/>`,
      ),
  },
  {
    id: 'stripes',
    category: 'backgrounds',
    tags: ['diagonal', 'pattern', 'lines'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) =>
      rect(w, h, c.background) +
      pattern(
        w,
        h,
        [40, 40],
        `<rect width="16" height="40" fill="${c.primary}" fill-opacity=".1"/>`,
        'rotate(45)',
      ),
  },
  {
    id: 'waves',
    category: 'backgrounds',
    tags: ['wavy', 'pattern', 'water', 'lines'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) =>
      rect(w, h, c.background) +
      pattern(
        w,
        h,
        [120, 48],
        `<path d="M0 24C20 8 40 8 60 24S100 40 120 24" fill="none" stroke="${c.primary}" stroke-opacity=".22" stroke-width="3"/>`,
      ),
  },
  {
    id: 'chevron',
    category: 'backgrounds',
    tags: ['zigzag', 'pattern'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) =>
      rect(w, h, c.background) +
      pattern(
        w,
        h,
        [80, 40],
        `<polyline points="-20,10 0,30 20,10 40,30 60,10 80,30 100,10" fill="none" stroke="${c.secondary}" stroke-opacity=".22" stroke-width="5"/>`,
      ),
  },
  {
    id: 'gingham',
    category: 'backgrounds',
    tags: ['checks', 'picnic', 'tablecloth', 'pattern', 'food'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) =>
      rect(w, h, c.background) +
      pattern(
        w,
        h,
        [60, 60],
        `<rect width="30" height="60" fill="${c.primary}" fill-opacity=".13"/><rect width="60" height="30" fill="${c.primary}" fill-opacity=".13"/>`,
      ),
  },
  {
    id: 'confetti',
    category: 'backgrounds',
    tags: ['party', 'celebration', 'birthday', 'festive'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) => {
      const rand = random(7);
      const colors: [string, string, string] = [c.primary, c.secondary, c.accent];
      const count = Math.round(((w * h) / 1_000_000) * 110);
      let pieces = '';
      for (let i = 0; i < count; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const fill = pick(colors, rand());
        const turn = n(rand() * 360);
        const kind = rand();
        if (kind < 0.45)
          pieces += `<rect x="${n(x - 10)}" y="${n(y - 4)}" width="${n(16 + rand() * 10)}" height="8" rx="2" fill="${fill}" transform="rotate(${turn} ${n(x)} ${n(y)})"/>`;
        else if (kind < 0.75)
          pieces += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(4 + rand() * 3)}" fill="${fill}"/>`;
        else
          pieces += `<polygon points="${n(x)},${n(y - 9)} ${n(x + 8)},${n(y + 6)} ${n(x - 8)},${n(y + 6)}" fill="${fill}" transform="rotate(${turn} ${n(x)} ${n(y)})"/>`;
      }
      return `${rect(w, h, c.background)}<g fill-opacity=".85">${pieces}</g>`;
    },
  },
  {
    id: 'soft-gradient',
    category: 'backgrounds',
    tags: ['mesh', 'blur', 'glow', 'aurora'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) => {
      const m = Math.max(w, h);
      const glow = (id: string, color: string, opacity: number) =>
        `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${opacity}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
      return (
        rect(w, h, c.background) +
        `<defs>${glow('a', c.primary, 0.5)}${glow('b', c.secondary, 0.42)}${glow('c', c.accent, 0.4)}</defs>` +
        `<circle cx="${n(w * 0.12)}" cy="${n(h * 0.1)}" r="${n(m * 0.7)}" fill="url(#a)"/>` +
        `<circle cx="${n(w * 0.95)}" cy="${n(h * 0.92)}" r="${n(m * 0.65)}" fill="url(#b)"/>` +
        `<circle cx="${n(w * 0.88)}" cy="${n(h * 0.08)}" r="${n(m * 0.42)}" fill="url(#c)"/>`
      );
    },
  },
  {
    id: 'blobs',
    category: 'backgrounds',
    tags: ['organic', 'shapes', 'corners', 'modern'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) => {
      const m = Math.min(w, h);
      return (
        rect(w, h, c.background) +
        `<path d="${blobPath(w * 0.04, h * 0.03, m * 0.28, 11, 9, 0.16)}" fill="${c.primary}" fill-opacity=".9"/>` +
        `<path d="${blobPath(w * 0.97, h * 0.98, m * 0.32, 23, 9, 0.16)}" fill="${c.secondary}" fill-opacity=".85"/>` +
        `<path d="${blobPath(w * 0.88, h * 0.12, m * 0.08, 5, 7, 0.2)}" fill="${c.accent}"/>` +
        `<path d="${blobPath(w * 0.1, h * 0.86, m * 0.06, 9, 7, 0.2)}" fill="${c.accent}" fill-opacity=".8"/>` +
        `<g fill="${c.muted}" fill-opacity=".25"><circle cx="${n(w * 0.3)}" cy="${n(h * 0.9)}" r="${n(m * 0.012)}"/><circle cx="${n(w * 0.7)}" cy="${n(h * 0.07)}" r="${n(m * 0.01)}"/><circle cx="${n(w * 0.93)}" cy="${n(h * 0.45)}" r="${n(m * 0.014)}"/></g>`
      );
    },
  },
  {
    id: 'wave-footer',
    category: 'backgrounds',
    tags: ['waves', 'bottom', 'header', 'flowing'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) =>
      rect(w, h, c.background) +
      `<path d="${waveBand(w, h, h * 0.8, h * 0.025, w * 0.9, 0)}" fill="${c.secondary}" fill-opacity=".35"/>` +
      `<path d="${waveBand(w, h, h * 0.86, h * 0.022, w * 0.7, 1.3)}" fill="${c.primary}" fill-opacity=".9"/>` +
      `<path d="${waveBand(w, h, h * 0.93, h * 0.015, w * 0.55, 2.2)}" fill="${c.secondary}" fill-opacity=".9"/>`,
  },
  {
    id: 'sunburst',
    category: 'backgrounds',
    tags: ['rays', 'retro', 'sale', 'bold'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) => {
      const cx = w / 2;
      const cy = h * 0.5;
      const reach = Math.hypot(w, h);
      const rays = 28;
      let wedges = '';
      for (let i = 0; i < rays; i += 2) {
        const a1 = (i / rays) * Math.PI * 2;
        const a2 = ((i + 1) / rays) * Math.PI * 2;
        wedges += `M${n(cx)} ${n(cy)}L${n(cx + Math.cos(a1) * reach)} ${n(cy + Math.sin(a1) * reach)}L${n(cx + Math.cos(a2) * reach)} ${n(cy + Math.sin(a2) * reach)}Z`;
      }
      return (
        rect(w, h, c.primary) +
        `<path d="${wedges}" fill="${c.background}" fill-opacity=".12"/>` +
        `<defs><radialGradient id="g"><stop offset="0" stop-color="${c.background}" stop-opacity=".28"/><stop offset="1" stop-color="${c.background}" stop-opacity="0"/></radialGradient></defs>` +
        `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(Math.min(w, h) * 0.45)}" fill="url(#g)"/>`
      );
    },
  },
  {
    id: 'halftone',
    category: 'backgrounds',
    tags: ['dots', 'comic', 'gradient', 'pop art'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) => {
      const step = 36;
      let dots = '';
      for (let row = 0; row * step <= h + step; row++) {
        const y = row * step;
        const offset = row % 2 ? step / 2 : 0;
        for (let x = offset; x <= w + step; x += step) {
          const t = Math.max(0, (x / w + y / h) / 2 - 0.35) / 0.65;
          const r = Math.min(1, t) * step * 0.46;
          if (r >= 0.8) dots += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`;
        }
      }
      return `${rect(w, h, c.background)}<g fill="${c.primary}" fill-opacity=".3">${dots}</g>`;
    },
  },
  {
    id: 'memphis',
    category: 'backgrounds',
    tags: ['playful', 'shapes', 'squiggles', 'retro', 'kids'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) => {
      const rand = random(17);
      const colors: [string, string, string] = [c.primary, c.secondary, c.accent];
      const cell = 170;
      let shapes = '';
      for (let gy = 0; gy * cell < h; gy++) {
        for (let gx = 0; gx * cell < w; gx++) {
          const x = gx * cell + 30 + rand() * (cell - 60);
          const y = gy * cell + 30 + rand() * (cell - 60);
          const color = pick(colors, rand());
          const turn = n(rand() * 360);
          const kind = Math.floor(rand() * 5);
          const stroke = `fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`;
          const at = `transform="rotate(${turn} ${n(x)} ${n(y)})"`;
          if (kind === 0)
            shapes += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(18 + rand() * 8)}" ${stroke}/>`;
          else if (kind === 1)
            shapes += `<polygon points="${n(x)},${n(y - 20)} ${n(x + 18)},${n(y + 12)} ${n(x - 18)},${n(y + 12)}" ${stroke} ${at}/>`;
          else if (kind === 2)
            shapes += `<polyline points="${n(x - 27)},${n(y)} ${n(x - 18)},${n(y - 9)} ${n(x - 9)},${n(y)} ${n(x)},${n(y - 9)} ${n(x + 9)},${n(y)} ${n(x + 18)},${n(y - 9)} ${n(x + 27)},${n(y)}" ${stroke} ${at}/>`;
          else if (kind === 3)
            shapes += `<path d="M${n(x - 14)} ${n(y)}H${n(x + 14)}M${n(x)} ${n(y - 14)}V${n(y + 14)}" ${stroke} ${at}/>`;
          else
            shapes += `<path d="M${n(x - 20)} ${n(y)}A20 20 0 0 1 ${n(x + 20)} ${n(y)}Z" fill="${color}" ${at}/>`;
        }
      }
      return `${rect(w, h, c.background)}<g opacity=".75">${shapes}</g>`;
    },
  },
  {
    id: 'mountains',
    category: 'backgrounds',
    tags: ['landscape', 'nature', 'outdoors', 'sun', 'travel'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) =>
      `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.surface}"/><stop offset="1" stop-color="${c.background}"/></linearGradient></defs>` +
      rect(w, h, 'url(#sky)') +
      `<circle cx="${n(w * 0.72)}" cy="${n(h * 0.36)}" r="${n(Math.min(w, h) * 0.09)}" fill="${c.accent}" fill-opacity=".9"/>` +
      polygon(
        ridge(w, h, [
          [0, 0.66],
          [0.12, 0.56],
          [0.25, 0.63],
          [0.4, 0.5],
          [0.55, 0.6],
          [0.7, 0.48],
          [0.85, 0.58],
          [1, 0.52],
        ]),
        c.secondary,
        ' fill-opacity=".35"',
      ) +
      polygon(
        ridge(w, h, [
          [0, 0.74],
          [0.15, 0.62],
          [0.3, 0.72],
          [0.48, 0.6],
          [0.62, 0.7],
          [0.8, 0.6],
          [1, 0.68],
        ]),
        c.secondary,
        ' fill-opacity=".7"',
      ) +
      polygon(
        ridge(w, h, [
          [0, 0.86],
          [0.2, 0.76],
          [0.38, 0.84],
          [0.58, 0.74],
          [0.78, 0.83],
          [1, 0.75],
        ]),
        c.primary,
      ),
  },
  {
    id: 'bokeh',
    category: 'backgrounds',
    tags: ['lights', 'glow', 'night', 'party', 'circles'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) => {
      const rand = random(29);
      let lights = '';
      const count = Math.round(((w * h) / 1_000_000) * 30);
      for (let i = 0; i < count; i++) {
        const color = rand() < 0.7 ? c.background : c.accent;
        lights += `<circle cx="${n(rand() * w)}" cy="${n(rand() * h)}" r="${n(18 + rand() * 72)}" fill="${color}" fill-opacity="${n(0.06 + rand() * 0.14)}"/>`;
      }
      return rect(w, h, c.primary) + lights;
    },
  },

  // Frames: transparent inside, redrawn so the border hugs any frame.
  {
    id: 'frame-classic',
    category: 'frames',
    tags: ['border', 'certificate', 'award', 'formal'],
    width: 1000,
    height: 707,
    adaptive: true,
    draw: ({ c, w, h }) => {
      const m = Math.min(w, h);
      const outer = m * 0.035;
      const inner = m * 0.058;
      const corner = m * 0.022;
      const corners: Point[] = [
        [inner, inner],
        [w - inner, inner],
        [w - inner, h - inner],
        [inner, h - inner],
      ];
      return (
        `<rect x="${n(outer)}" y="${n(outer)}" width="${n(w - outer * 2)}" height="${n(h - outer * 2)}" fill="none" stroke="${c.primary}" stroke-width="${n(m * 0.012)}"/>` +
        `<rect x="${n(inner)}" y="${n(inner)}" width="${n(w - inner * 2)}" height="${n(h - inner * 2)}" fill="none" stroke="${c.secondary}" stroke-width="${n(m * 0.003)}"/>` +
        corners
          .map(
            ([x, y]) =>
              `<rect x="${n(x - corner / 2)}" y="${n(y - corner / 2)}" width="${n(corner)}" height="${n(corner)}" fill="${c.primary}" transform="rotate(45 ${n(x)} ${n(y)})"/><circle cx="${n(x)}" cy="${n(y)}" r="${n(corner * 0.22)}" fill="${c.accent}"/>`,
          )
          .join('')
      );
    },
  },
  {
    id: 'frame-rounded',
    category: 'frames',
    tags: ['border', 'soft', 'card', 'invitation'],
    width: 1000,
    height: 1000,
    adaptive: true,
    draw: ({ c, w, h }) => {
      const m = Math.min(w, h);
      const a = m * 0.04;
      const b = m * 0.062;
      return (
        `<rect x="${n(a)}" y="${n(a)}" width="${n(w - a * 2)}" height="${n(h - a * 2)}" rx="${n(m * 0.05)}" fill="none" stroke="${c.primary}" stroke-width="${n(m * 0.008)}"/>` +
        `<rect x="${n(b)}" y="${n(b)}" width="${n(w - b * 2)}" height="${n(h - b * 2)}" rx="${n(m * 0.032)}" fill="none" stroke="${c.secondary}" stroke-opacity=".7" stroke-width="${n(m * 0.003)}" stroke-dasharray="${n(m * 0.012)} ${n(m * 0.008)}"/>`
      );
    },
  },
  {
    id: 'photo-placeholder',
    category: 'frames',
    tags: ['image', 'picture', 'replace', 'photo'],
    width: 1000,
    height: 750,
    adaptive: true,
    draw: ({ c, w, h }) => {
      const s = Math.min(w, h) * 0.3;
      const x = (w - s) / 2;
      const y = (h - s * 0.78) / 2;
      const bh = s * 0.78;
      return (
        rect(w, h, c.surface) +
        `<g fill="${c.muted}" fill-opacity=".4">` +
        `<rect x="${n(x)}" y="${n(y)}" width="${n(s)}" height="${n(bh)}" rx="${n(s * 0.08)}" fill="none" stroke="${c.muted}" stroke-opacity=".45" stroke-width="${n(s * 0.05)}"/>` +
        polygon(
          [
            [x + s * 0.12, y + bh * 0.82],
            [x + s * 0.4, y + bh * 0.42],
            [x + s * 0.6, y + bh * 0.66],
            [x + s * 0.72, y + bh * 0.54],
            [x + s * 0.88, y + bh * 0.82],
          ],
          c.muted,
          ' fill-opacity=".4"',
        ) +
        `<circle cx="${n(x + s * 0.7)}" cy="${n(y + bh * 0.3)}" r="${n(s * 0.08)}"/></g>`
      );
    },
  },

  // Decorations: transparent, fixed proportions.
  {
    id: 'bunting',
    category: 'decorations',
    tags: ['flags', 'garland', 'party', 'celebration', 'fair'],
    width: 1000,
    height: 220,
    draw: ({ c }) => {
      const p0: Point = [0, 40];
      const p1: Point = [500, 170];
      const p2: Point = [1000, 40];
      const colors: [string, string, string] = [c.primary, c.secondary, c.accent];
      let flags = '';
      for (let i = 0; i < 11; i++) {
        const { x, y, angle } = quadraticAt(p0, p1, p2, (i + 0.5) / 11);
        flags += `<polygon points="-36,0 36,0 0,95" fill="${colors[i % 3]}" transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})"/>`;
      }
      return `${flags}<path d="M0 40Q500 170 1000 40" fill="none" stroke="${c.text}" stroke-opacity=".55" stroke-width="3"/>`;
    },
  },
  {
    id: 'balloons',
    category: 'decorations',
    tags: ['party', 'birthday', 'celebration'],
    width: 600,
    height: 800,
    draw: ({ c }) => {
      const balloons: [number, number, number, number, string][] = [
        [200, 250, 105, 125, c.primary],
        [400, 215, 100, 120, c.secondary],
        [300, 360, 95, 115, c.accent],
      ];
      let strings = '';
      let shapes = '';
      for (const [cx, cy, rx, ry, color] of balloons) {
        const by = cy + ry + 12;
        strings += `M${cx} ${by}C${cx - 25} ${by + 120} 325 640 300 780`;
        shapes +=
          `<polygon points="${cx - 11},${by} ${cx + 11},${by} ${cx},${cy + ry - 3}" fill="${color}"/>` +
          `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}"/>` +
          `<ellipse cx="${n(cx - rx * 0.38)}" cy="${n(cy - ry * 0.42)}" rx="${n(rx * 0.16)}" ry="${n(ry * 0.26)}" fill="#ffffff" fill-opacity=".35" transform="rotate(-25 ${n(cx - rx * 0.38)} ${n(cy - ry * 0.42)})"/>`;
      }
      return `<path d="${strings}" fill="none" stroke="${c.muted}" stroke-width="3"/>${shapes}`;
    },
  },
  {
    id: 'sparkles',
    category: 'decorations',
    tags: ['stars', 'shine', 'magic', 'new'],
    width: 400,
    height: 400,
    draw: ({ c }) =>
      `<path d="${sparklePath(170, 215, 140)}" fill="${c.accent}"/>` +
      `<path d="${sparklePath(318, 95, 62)}" fill="${c.primary}"/>` +
      `<path d="${sparklePath(325, 300, 40)}" fill="${c.secondary}"/>` +
      `<circle cx="80" cy="70" r="9" fill="${c.primary}" fill-opacity=".6"/><circle cx="60" cy="335" r="7" fill="${c.secondary}" fill-opacity=".7"/>`,
  },
  {
    id: 'laurel',
    category: 'decorations',
    tags: ['wreath', 'award', 'winner', 'certificate', 'leaves'],
    width: 600,
    height: 520,
    draw: ({ c }) => {
      const p0: Point = [290, 495];
      const p1: Point = [30, 400];
      const p2: Point = [125, 70];
      let leaves = '';
      for (let k = 0; k < 10; k++) {
        const t = 0.07 + k * 0.095;
        const { x, y, angle } = quadraticAt(p0, p1, p2, t);
        const length = 74 * (1 - t * 0.35);
        const leaf = leafPath(length, length * 0.42);
        leaves += `<path d="${leaf}" transform="translate(${n(x)} ${n(y)}) rotate(${n(angle - 38)})"/><path d="${leaf}" transform="translate(${n(x)} ${n(y)}) rotate(${n(angle + 38)})"/>`;
      }
      const tip = quadraticAt(p0, p1, p2, 1);
      leaves += `<path d="${leafPath(56, 24)}" transform="translate(${n(tip.x)} ${n(tip.y)}) rotate(${n(tip.angle)})"/>`;
      const branch = `<path d="M290 495Q30 400 125 70" fill="none" stroke="${c.primary}" stroke-width="6" stroke-linecap="round"/><g fill="${c.primary}">${leaves}</g>`;
      return `${branch}<g transform="translate(600 0) scale(-1 1)">${branch}</g>`;
    },
  },
  {
    id: 'ribbon-banner',
    category: 'decorations',
    tags: ['banner', 'title', 'label', 'award'],
    width: 1000,
    height: 260,
    draw: ({ c }) =>
      polygon(
        [
          [190, 70],
          [40, 70],
          [92, 150],
          [40, 230],
          [190, 230],
        ],
        c.secondary,
      ) +
      polygon(
        [
          [810, 70],
          [960, 70],
          [908, 150],
          [960, 230],
          [810, 230],
        ],
        c.secondary,
      ) +
      `<g fill="#000000" fill-opacity=".28">${polygon(
        [
          [150, 190],
          [190, 190],
          [190, 230],
        ],
        '#000000',
      )}${polygon(
        [
          [850, 190],
          [810, 190],
          [810, 230],
        ],
        '#000000',
      )}</g>` +
      `<rect x="150" y="30" width="700" height="160" fill="${c.primary}"/>`,
  },
  {
    id: 'seal',
    category: 'decorations',
    tags: ['badge', 'rosette', 'stamp', 'award', 'quality'],
    width: 500,
    height: 500,
    draw: ({ c }) =>
      `<path d="${radialPolygon(250, 250, 24, 240, 214)}" fill="${c.primary}"/>` +
      `<circle cx="250" cy="250" r="190" fill="none" stroke="${c.background}" stroke-opacity=".9" stroke-width="6"/>` +
      `<circle cx="250" cy="250" r="172" fill="none" stroke="${c.background}" stroke-opacity=".6" stroke-width="2.5" stroke-dasharray="4 9" stroke-linecap="round"/>`,
  },
  {
    id: 'brush-stroke',
    category: 'decorations',
    tags: ['paint', 'highlight', 'swash', 'marker'],
    width: 1000,
    height: 300,
    draw: ({ c }) => {
      const rand = random(41);
      const top: Point[] = [];
      const bottom: Point[] = [];
      for (let i = 0; i <= 12; i++) {
        const x = 70 + (i / 12) * 860;
        top.push([x, 82 + (rand() - 0.5) * 22]);
        bottom.push([x, 220 + (rand() - 0.5) * 26]);
      }
      const outline: Point[] = [[22, 155], ...top, [985, 140], ...bottom.reverse()];
      return `<path d="${smoothClosedPath(outline)}" fill="${c.accent}" fill-opacity=".9"/>`;
    },
  },
  {
    id: 'divider',
    category: 'decorations',
    tags: ['line', 'separator', 'ornament', 'menu'],
    width: 1000,
    height: 80,
    draw: ({ c }) =>
      `<path d="M40 40H430M570 40H960" fill="none" stroke="${c.muted}" stroke-width="3" stroke-linecap="round"/>` +
      polygon(
        [
          [500, 18],
          [522, 40],
          [500, 62],
          [478, 40],
        ],
        c.primary,
      ) +
      `<circle cx="455" cy="40" r="6" fill="${c.accent}"/><circle cx="545" cy="40" r="6" fill="${c.accent}"/>`,
  },
  {
    id: 'flower',
    category: 'decorations',
    tags: ['bloom', 'spring', 'nature', 'floral'],
    width: 500,
    height: 500,
    draw: ({ c }) => {
      let petals = '';
      for (let k = 0; k < 8; k++)
        petals += `<ellipse cx="250" cy="125" rx="62" ry="118" transform="rotate(${k * 45} 250 250)"/>`;
      let inner = '';
      for (let k = 0; k < 8; k++)
        inner += `<ellipse cx="250" cy="172" rx="40" ry="78" transform="rotate(${k * 45 + 22.5} 250 250)"/>`;
      let seeds = '';
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        seeds += `<circle cx="${n(250 + Math.cos(a) * 30)}" cy="${n(250 + Math.sin(a) * 30)}" r="7"/>`;
      }
      return `<g fill="${c.primary}" fill-opacity=".9">${petals}</g><g fill="${c.accent}">${inner}</g><circle cx="250" cy="250" r="58" fill="${c.secondary}"/><g fill="#ffffff" fill-opacity=".55">${seeds}</g>`;
    },
  },
  {
    id: 'leaves',
    category: 'decorations',
    tags: ['branch', 'plant', 'nature', 'eco', 'green'],
    width: 600,
    height: 420,
    draw: ({ c }) => {
      const p0: Point = [40, 385];
      const p1: Point = [310, 330];
      const p2: Point = [560, 60];
      let leaves = '';
      for (let k = 0; k < 9; k++) {
        const t = 0.1 + k * 0.095;
        const { x, y, angle } = quadraticAt(p0, p1, p2, t);
        const length = 100 * (1 - t * 0.3);
        leaves += `<path d="${leafPath(length, length * 0.45)}" fill="${k % 2 ? c.secondary : c.primary}" transform="translate(${n(x)} ${n(y)}) rotate(${n(angle + (k % 2 ? 42 : -42))})"/>`;
      }
      const tip = quadraticAt(p0, p1, p2, 1);
      leaves += `<path d="${leafPath(80, 34)}" fill="${c.primary}" transform="translate(${n(tip.x)} ${n(tip.y)}) rotate(${n(tip.angle)})"/>`;
      return `<path d="M40 385Q310 330 560 60" fill="none" stroke="${c.primary}" stroke-width="6" stroke-linecap="round"/>${leaves}`;
    },
  },

  // Illustrations: simple flat drawings, fixed proportions.
  {
    id: 'cake',
    category: 'illustrations',
    tags: ['birthday', 'party', 'bakery', 'dessert', 'candles'],
    width: 500,
    height: 520,
    draw: ({ c }) => {
      const icing = (x: number, y: number, width: number) => {
        let d = `M${x} ${y + 12}Q${x} ${y} ${x + 12} ${y}H${x + width - 12}Q${x + width} ${y} ${x + width} ${y + 12}V${y + 32}`;
        const segments = Math.round(width / 40);
        const step = width / segments;
        for (let i = 0; i < segments; i++)
          d += `A${n(step / 2)} ${n(step / 2)} 0 0 1 ${n(x + width - step * (i + 1))} ${y + 32}`;
        return `<path d="${d}Z" fill="#ffffff" fill-opacity=".92"/>`;
      };
      let candles = '';
      for (const x of [190, 250, 310])
        candles +=
          `<rect x="${x - 8}" y="120" width="16" height="72" rx="4" fill="${c.accent}"/>` +
          `<path d="M${x} 82C${x + 11} 98 ${x + 10} 114 ${x} 114C${x - 10} 114 ${x - 11} 98 ${x} 82Z" fill="#f59e0b"/>` +
          `<path d="M${x} 96C${x + 5} 104 ${x + 5} 112 ${x} 112C${x - 5} 112 ${x - 5} 104 ${x} 96Z" fill="#fde68a"/>`;
      let sprinkles = '';
      const rand = random(3);
      for (let i = 0; i < 14; i++)
        sprinkles += `<circle cx="${n(95 + rand() * 310)}" cy="${n(370 + rand() * 75)}" r="5"/>`;
      return (
        `<ellipse cx="250" cy="470" rx="215" ry="26" fill="${c.muted}" fill-opacity=".25"/>` +
        `<rect x="70" y="300" width="360" height="165" rx="18" fill="${c.primary}"/>` +
        icing(70, 300, 360) +
        `<g fill="#ffffff" fill-opacity=".55">${sprinkles}</g>` +
        `<rect x="130" y="190" width="240" height="120" rx="16" fill="${c.secondary}"/>` +
        icing(130, 190, 240) +
        candles
      );
    },
  },
  {
    id: 'gift',
    category: 'illustrations',
    tags: ['present', 'birthday', 'holiday', 'surprise', 'sale'],
    width: 440,
    height: 440,
    draw: ({ c }) =>
      `<rect x="80" y="190" width="280" height="220" rx="10" fill="${c.primary}"/>` +
      `<rect x="60" y="140" width="320" height="70" rx="10" fill="${c.primary}"/>` +
      `<rect x="60" y="140" width="320" height="70" rx="10" fill="#000000" fill-opacity=".14"/>` +
      `<rect x="200" y="140" width="40" height="270" fill="${c.accent}"/>` +
      `<path d="M220 140C170 60 110 90 150 130C170 148 200 145 220 140Z" fill="${c.accent}"/>` +
      `<path d="M220 140C270 60 330 90 290 130C270 148 240 145 220 140Z" fill="${c.accent}"/>` +
      `<circle cx="220" cy="140" r="16" fill="${c.secondary}"/>`,
  },
  {
    id: 'coffee',
    category: 'illustrations',
    tags: ['cafe', 'cup', 'drink', 'tea', 'breakfast'],
    width: 420,
    height: 420,
    draw: ({ c }) =>
      `<ellipse cx="210" cy="362" rx="172" ry="30" fill="${c.muted}" fill-opacity=".3"/>` +
      `<path d="M325 200C390 200 390 292 315 292" fill="none" stroke="${c.primary}" stroke-width="20" stroke-linecap="round"/>` +
      `<path d="M90 170H330L310 320Q305 350 270 350H150Q115 350 110 320Z" fill="${c.primary}"/>` +
      `<ellipse cx="210" cy="172" rx="120" ry="16" fill="#4a2c1a"/>` +
      `<g fill="none" stroke="${c.muted}" stroke-opacity=".6" stroke-width="8" stroke-linecap="round"><path d="M170 140C150 115 190 100 170 70"/><path d="M210 135C190 105 230 95 210 55"/><path d="M250 140C230 115 270 100 250 70"/></g>`,
  },
  {
    id: 'graduation-cap',
    category: 'illustrations',
    tags: ['school', 'education', 'graduate', 'university', 'class'],
    width: 520,
    height: 420,
    draw: ({ c }) =>
      `<path d="M150 200V285C150 322 370 322 370 285V200Z" fill="${c.primary}"/>` +
      `<path d="M150 200V285C150 322 370 322 370 285V200Z" fill="#000000" fill-opacity=".18"/>` +
      polygon(
        [
          [260, 60],
          [500, 150],
          [260, 240],
          [20, 150],
        ],
        c.primary,
      ) +
      `<path d="M260 150L430 190V292" fill="none" stroke="${c.accent}" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M418 290H442L454 348H406Z" fill="${c.accent}"/>` +
      `<circle cx="260" cy="150" r="11" fill="${c.accent}"/>`,
  },
  {
    id: 'skyline',
    category: 'illustrations',
    tags: ['city', 'buildings', 'urban', 'business', 'downtown'],
    width: 1000,
    height: 420,
    draw: ({ c }) => {
      const rand = random(31);
      let back = '';
      for (let x = -20; x < 1000; ) {
        const width = 60 + rand() * 70;
        const height = 200 + rand() * 180;
        back += `<rect x="${n(x)}" y="${n(420 - height)}" width="${n(width)}" height="${n(height)}"/>`;
        x += width + 6;
      }
      let front = '';
      let windows = '';
      for (let x = 0; x < 1000; ) {
        const width = 50 + rand() * 60;
        const height = 110 + rand() * 170;
        const top = 420 - height;
        front += `<rect x="${n(x)}" y="${n(top)}" width="${n(width)}" height="${n(height)}"/>`;
        for (let wy = top + 18; wy < 400; wy += 30)
          for (let wx = x + 12; wx < x + width - 16; wx += 22)
            if (rand() > 0.45) windows += `<rect x="${n(wx)}" y="${n(wy)}" width="9" height="13"/>`;
        x += width + 8;
      }
      return `<g fill="${c.secondary}" fill-opacity=".45">${back}</g><g fill="${c.primary}">${front}</g><g fill="${c.background}" fill-opacity=".55">${windows}</g>`;
    },
  },
];
