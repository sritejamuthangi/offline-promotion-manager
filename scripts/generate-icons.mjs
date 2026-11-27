/**
 * Renders the PNG app icons in public/icons from public/favicon.svg. Not part of the build:
 * run it after changing the logo. It uses Playwright's browser; set PW_CHANNEL=msedge (or
 * chrome) to reuse an installed browser.
 *
 *   node scripts/generate-icons.mjs
 *
 * Maskable and Apple icons fill the square (systems apply their own corner shape), so the
 * rounded corners of the background are removed for them. The mark stays inside the
 * maskable safe zone (the middle 80%).
 */
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const source = await readFile('public/favicon.svg', 'utf8');
const square = source.replace(/(<rect width="64" height="64") rx="\d+"/, '$1');
if (square === source) throw new Error('favicon.svg no longer has the expected background.');

const icons = [
  { file: 'icon-192.png', size: 192, svg: source },
  { file: 'icon-512.png', size: 512, svg: source },
  { file: 'maskable-512.png', size: 512, svg: square },
  { file: 'apple-touch-icon.png', size: 180, svg: square },
];

await mkdir('public/icons', { recursive: true });
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const { file, size, svg } of icons) {
    await page.setViewportSize({ width: size, height: size });
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await page.setContent(
      `<body style="margin:0"><img src="${src}" width="${size}" height="${size}" style="display:block"></body>`,
    );
    await page.locator('img').evaluate((image) => image.decode());
    await page.screenshot({ path: `public/icons/${file}`, omitBackground: true });
    console.log(`public/icons/${file}`);
  }
} finally {
  await browser.close();
}
