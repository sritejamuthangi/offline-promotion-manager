import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { APP } from '@/config/app';
import {
  createPdf,
  DESKTOP_MAX_PIXELS,
  designSheet,
  fontUsage,
  imageSources,
  MARK_STROKE,
  MOBILE_MAX_PIXELS,
  orientationOf,
  type PdfPage,
  PT_PER_PX,
  planPrint,
  type Rect,
  rasterSize,
  setJpegDpi,
  setPngDpi,
  textCodePoints,
} from '@/core/print';
import type { Design } from '@/core/schema';
import { assetIdFromSrc } from '@/render/assetUrl';
import { assetRepository } from '@/storage';
import { blobToDataUrl, embeddedFontCss } from './fontEmbedding';
import { PrintArtwork } from './PrintArtwork';

export type ImageFormat = 'png' | 'jpeg';

/** Phones and tablets get smaller canvases than desktops. */
export function maxExportPixels(): number {
  return window.matchMedia?.('(pointer: coarse)').matches ? MOBILE_MAX_PIXELS : DESKTOP_MAX_PIXELS;
}

/** Every picture on the pages as a `data:` URL: an image cannot load anything else. */
async function embeddedImages(
  design: Design,
  pages: readonly number[],
): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  await Promise.all(
    imageSources(design, pages).map(async (src) => {
      const id = assetIdFromSrc(src);
      if (id) {
        const record = await assetRepository.get(id);
        if (!record) throw new Error('An uploaded image could not be loaded.');
        images.set(src, await blobToDataUrl(record.blob));
      } else if (!src.startsWith('library:') && !src.startsWith('data:')) {
        const response = await fetch(src, {
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) throw new Error('An image could not be loaded.');
        images.set(src, await blobToDataUrl(await response.blob()));
      }
    }),
  );
  return images;
}

/** The page's artwork as XHTML, drawn by the same component as the editor. */
function artworkMarkup(
  design: Design,
  pageIndex: number,
  images: Map<string, string>,
  bleed: number,
): string {
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(
        <PrintArtwork
          design={design}
          pageIndex={pageIndex}
          bleed={bleed}
          resolveSrc={(src) => images.get(src)}
        />,
      );
    });
    const node = host.firstElementChild;
    return node ? new XMLSerializer().serializeToString(node) : '';
  } finally {
    root.unmount();
  }
}

/** The app's base styles that the artwork relies on (Tailwind's preflight). */
const BASE_CSS =
  '*,::before,::after{box-sizing:border-box;margin:0;padding:0;border:0 solid}img,svg{display:block;vertical-align:middle}img{max-width:100%}';

const escapeXml = (text: string) =>
  text.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch] ?? ch);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The page could not be drawn.'));
    image.src = src;
  });
}

/** Safari can draw an SVG before its embedded fonts and pictures; it then needs a redraw. */
const isWebKit = () =>
  /AppleWebKit/.test(navigator.userAgent) &&
  !/Chrome|Chromium|Edg|Android/.test(navigator.userAgent);

interface Embedded {
  images: Map<string, string>;
  fontCss: string;
}

/** Prepare font bytes while the download preview is open, for offline file creation. */
export function prepareExportFonts(design: Design, pages: readonly number[]): Promise<string> {
  return embeddedFontCss(fontUsage(design, pages), textCodePoints(design, pages));
}

async function embed(design: Design, pages: readonly number[]): Promise<Embedded> {
  const [images, fontCss] = await Promise.all([
    embeddedImages(design, pages),
    prepareExportFonts(design, pages),
  ]);
  return { images, fontCss };
}

/**
 * Draws a page at `dpi`: the artwork's markup becomes an SVG image (with fonts and
 * pictures inlined), which the browser renders at full resolution onto a canvas.
 */
async function renderCanvas(
  design: Design,
  pageIndex: number,
  dpi: number,
  { images, fontCss }: Embedded,
  bleed = 0,
): Promise<{ canvas: HTMLCanvasElement; dpi: number }> {
  const width = design.width + 2 * bleed;
  const height = design.height + 2 * bleed;
  const size = rasterSize({ width, height }, dpi, maxExportPixels());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${width} ${height}"><foreignObject x="0" y="0" width="${width}" height="${height}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;font-family:&quot;Inter Variable&quot;,Inter,sans-serif;line-height:1.5"><style>${escapeXml(BASE_CSS + fontCss)}</style>${artworkMarkup(design, pageIndex, images, bleed)}</div></foreignObject></svg>`;
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot draw images.');
  const draw = () => {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(image, 0, 0, size.width, size.height);
  };
  draw();
  if (isWebKit()) {
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    draw();
  }
  return { canvas, dpi: size.dpi };
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be encoded.'))),
      type,
      quality,
    ),
  );
}

const release = (canvas: HTMLCanvasElement) => {
  canvas.width = 0;
  canvas.height = 0;
};

const bytesBlob = (bytes: Uint8Array, type: string) =>
  new Blob([bytes as Uint8Array<ArrayBuffer>], { type });

/** A PNG or JPG of one page, tagged with its resolution so it prints at true size. */
export async function exportImage(
  design: Design,
  pageIndex: number,
  format: ImageFormat,
  dpi: number,
): Promise<Blob> {
  const embedded = await embed(design, [pageIndex]);
  const { canvas, dpi: used } = await renderCanvas(design, pageIndex, dpi, embedded);
  try {
    const type = format === 'png' ? 'image/png' : 'image/jpeg';
    const bytes = new Uint8Array(await (await canvasBlob(canvas, type, 0.92)).arrayBuffer());
    return bytesBlob(format === 'png' ? setPngDpi(bytes, used) : setJpegDpi(bytes, used), type);
  } finally {
    release(canvas);
  }
}

/**
 * A PDF with one page per design page, each a high-resolution picture. With crop marks,
 * pages grow to hold the bleed and marks, and record trim and bleed boxes for printers.
 */
export async function exportPdf(
  design: Design,
  pages: readonly number[],
  options: { dpi: number; marks: boolean; bleed: number },
): Promise<Blob> {
  const bleed = options.marks ? Math.max(0, options.bleed) : 0;
  const paper = designSheet(design, options.marks, bleed);
  const plan = planPrint(design, pages, {
    layout: 'single',
    paper,
    orientation: orientationOf(paper),
    fitToPaper: false,
    copies: 1,
    gap: 0,
    posterScale: 1,
    overlap: 0,
    marks: options.marks,
    bleed,
    margin: 0,
  });
  if (plan.limited) throw new Error('Too many pages. Export a smaller selection.');
  const embedded = await embed(design, pages);
  const pt = (px: number) => px * PT_PER_PX;
  const box = (rect: Rect) => ({
    x: pt(rect.x),
    y: pt(rect.y),
    width: pt(rect.width),
    height: pt(rect.height),
  });
  const pdfPages: PdfPage[] = [];
  for (const sheet of plan.sheets) {
    const placement = sheet.placements[0];
    if (!placement) continue;
    const { canvas } = await renderCanvas(
      design,
      placement.pageIndex,
      options.dpi,
      embedded,
      bleed,
    );
    try {
      const jpeg = new Uint8Array(
        await (await canvasBlob(canvas, 'image/jpeg', 0.92)).arrayBuffer(),
      );
      pdfPages.push({
        width: pt(plan.sheet.width),
        height: pt(plan.sheet.height),
        image: { jpeg, width: canvas.width, height: canvas.height },
        imageBox: box(placement.clip),
        lines: sheet.marks.map((m) => ({ x1: pt(m.x1), y1: pt(m.y1), x2: pt(m.x2), y2: pt(m.y2) })),
        lineWidth: pt(MARK_STROKE),
        trimBox: box({
          x: placement.x,
          y: placement.y,
          width: design.width,
          height: design.height,
        }),
        bleedBox: box(placement.clip),
      });
    } finally {
      release(canvas);
    }
  }
  return bytesBlob(
    createPdf(pdfPages, {
      title: design.name,
      creator: APP.name,
      producer: `${APP.name} ${APP.version}`,
    }),
    'application/pdf',
  );
}

/** A safe file name from the design name; `copy` numbers files for multi-page exports. */
export function exportFileName(name: string, extension: string, copy?: number): string {
  const cleaned = Array.from(name.normalize('NFC'), (ch) =>
    ch.charCodeAt(0) < 32 || ch === '\u007f' || '\\/:*?"<>|'.includes(ch) ? ' ' : ch,
  )
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .slice(0, 100)
    .trim();
  return `${cleaned || 'design'}${copy !== undefined ? ` (${copy})` : ''}.${extension}`;
}

/** Saves a file through the browser's normal download. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  // Some browsers start reading the file after `click()` returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
