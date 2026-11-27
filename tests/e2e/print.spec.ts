import { readFile } from 'node:fs/promises';
import { expect, type Page, test } from '@playwright/test';
import type { Design } from '../../src/core/schema';

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Print or download' });
const preview = (page: Page) => dialog(page).getByTestId('print-preview');

async function template(page: Page, id = 'business-card') {
  await page.goto(`./templates/${id}`);
  await page.getByRole('button', { name: 'Use this template' }).click();
  await expect(page.getByTestId('editor-canvas')).toBeVisible();
}

async function open(page: Page, tab: 'Print' | 'Download' = 'Print') {
  await page.getByRole('button', { name: tab, exact: true }).click();
  await expect(dialog(page)).toBeVisible();
}

async function print(page: Page) {
  // Exercise preparation and cleanup without opening an OS print dialog in the test runner.
  await page.evaluate(() => {
    delete document.body.dataset.printCalled;
    window.print = () => {
      document.body.dataset.printCalled = 'true';
    };
  });
  await dialog(page).getByRole('button', { name: 'Print', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-print-called', 'true');
  return page.getByTestId('print-root');
}

async function finishPrint(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(dialog(page).getByRole('button', { name: 'Print', exact: true })).toBeEnabled();
  // Phone browsers may lay out the printout after `afterprint`, so the sheets stay ready
  // until the dialog closes.
  await expect(page.getByTestId('print-root')).toHaveCount(1);
}

async function download(page: Page, path: string) {
  const pending = page.waitForEvent('download');
  await dialog(page).getByRole('button', { name: 'Download', exact: true }).click();
  const file = await pending;
  await file.saveAs(path);
  return { name: file.suggestedFilename(), bytes: await readFile(path) };
}

function pdfPages(bytes: Buffer) {
  return [...bytes.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length;
}

function pdfSize(bytes: Buffer) {
  const match = /\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/.exec(bytes.toString('latin1'));
  return [Number(match?.[1]), Number(match?.[2])];
}

/** Seed document variations through the public persisted format, then reopen the editor. */
async function fixture(page: Page, kind: 'two-pages' | 'photo-fill' | 'banner' | 'missing-photo') {
  const url = page.url();
  const id = url.split('/').at(-1) ?? '';
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page.getByTestId('design-card').first()).toBeVisible();
  await page.evaluate(
    async ({ id, kind }) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('offline-promotion-manager');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        await new Promise<void>((resolve, reject) => {
          const transaction = database.transaction('designs', 'readwrite');
          const designs = transaction.objectStore('designs');
          const request = designs.get(id);
          request.onsuccess = () => {
            const design: Design = request.result;
            const first = design.pages[0];
            if (!first) throw new Error('No page in fixture');
            if (kind === 'two-pages') {
              const second = structuredClone(first);
              second.id = 'second-page';
              second.elements.forEach((element) => {
                element.id += '-second';
              });
              for (const element of second.elements)
                if (element.type === 'text') element.text = 'SECOND PAGE';
              design.pages.push(second);
            } else if (kind === 'banner') {
              design.width = 96_000;
              design.height = 240;
              design.unit = 'mm';
              first.elements = [];
              first.background = { type: 'solid', color: '#0ea5e9' };
            } else if (kind === 'photo-fill') {
              const photo = first.elements.find((element) => element.type === 'image');
              if (photo?.type !== 'image') throw new Error('No uploaded photo');
              photo.x = 0;
              photo.y = 0;
              photo.width = design.width;
              photo.height = design.height;
              first.elements = [photo];
              first.background = { type: 'image', src: photo.src, fit: 'cover' };
            } else {
              first.background = { type: 'image', src: 'asset:missing', fit: 'cover' };
            }
            designs.put(design);
          };
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      } finally {
        database.close();
      }
    },
    { id, kind },
  );
  await page.goto(url);
  await expect(page.getByTestId('editor-canvas')).toBeVisible();
}

/** Decode the actual downloaded file, including a few artwork pixels. */
async function pixels(page: Page, bytes: Buffer, mime = 'image/png') {
  return page.evaluate(
    async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No canvas');
      context.drawImage(image, 0, 0);
      const sample = (x: number, y: number) => [
        ...context.getImageData(Math.floor(x * image.width), Math.floor(y * image.height), 1, 1)
          .data,
      ];
      return {
        width: image.width,
        height: image.height,
        left: sample(0.05, 0.5),
        centre: sample(0.5, 0.5),
        lowerEdge: sample(0.5, 0.95),
      };
    },
    `data:${mime};base64,${bytes.toString('base64')}`,
  );
}

test('prints actual-size cards with cut marks and exact pagination', async ({ page }, info) => {
  await template(page);
  await open(page);
  await expect(dialog(page).getByTestId('print-summary')).toHaveText('10 per sheet · 1 sheet');
  await dialog(page).getByLabel('Copies of each page').fill('25');
  await expect(dialog(page).getByTestId('print-summary')).toHaveText('10 per sheet · 3 sheets');
  const root = await print(page);
  await expect(root.locator('[data-print-sheet]')).toHaveCount(3);
  await expect(root.locator('[data-print-placement]')).toHaveCount(25);
  await expect(root.locator('[data-print-marks]').first()).toHaveAttribute(
    'data-print-marks',
    '18',
  );
  expect(await root.locator('style').textContent()).toContain('210.0000mm 297.0000mm');
  const width = await root
    .locator('[data-print-placement]')
    .first()
    .evaluate((node: HTMLElement) => parseFloat(node.style.width));
  expect(width).toBeCloseTo((85 * 96) / 25.4, 3);
  const pdf = await page.pdf({
    path: info.outputPath('cards.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
  });
  expect(pdfPages(pdf)).toBe(3);
  const [w = 0, h = 0] = pdfSize(pdf);
  expect(Math.abs(w - (210 * 72) / 25.4)).toBeLessThan(0.5);
  expect(Math.abs(h - (297 * 72) / 25.4)).toBeLessThan(0.5);
  await finishPrint(page);
});

test('tiles posters with overlap, navigable previews and cleanup on cancel', async ({
  page,
}, info) => {
  await template(page, 'hiring-poster');
  await open(page);
  await dialog(page).getByRole('radio', { name: 'Poster', exact: true }).click();
  await expect(dialog(page).getByTestId('print-summary')).toHaveText(
    '297 × 420 mm across 2 × 2 sheets',
  );
  await expect(preview(page)).toContainText('A1 · row 1 of 2, column 1 of 2');
  await dialog(page).getByRole('button', { name: 'Next sheet' }).click();
  await expect(preview(page)).toContainText('A2 · row 1 of 2, column 2 of 2');
  const root = await print(page);
  await expect(root.locator('[data-print-sheet]')).toHaveCount(4);
  const clips = await root.locator('[data-print-placement]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      width: parseFloat((node as HTMLElement).style.width),
      x: parseFloat((node.firstElementChild as HTMLElement).style.left),
    })),
  );
  expect(clips[0]?.width).toBeCloseTo((190 * 96) / 25.4, 3);
  expect(clips[1]?.x).toBeCloseTo((-180 * 96) / 25.4, 3);
  const pdf = await page.pdf({
    path: info.outputPath('poster.pdf'),
    preferCSSPageSize: true,
    printBackground: true,
  });
  expect(pdfPages(pdf)).toBe(4);
  await finishPrint(page);
  await print(page);
  await dialog(page).getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByTestId('print-root')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveClass(/opm-printing/);
});

test('supports custom paper, fit-to-paper and invalid-layout feedback', async ({ page }) => {
  await template(page);
  await open(page);
  await dialog(page).getByRole('radio', { name: 'One per sheet' }).click();
  await dialog(page).getByLabel('Paper', { exact: true }).selectOption('custom');
  await dialog(page).getByLabel('Width', { exact: false }).fill('140');
  await dialog(page).getByLabel('Height', { exact: false }).fill('200');
  await dialog(page).getByLabel('Orientation').selectOption('landscape');
  const root = await print(page);
  expect(await root.locator('style').textContent()).toContain('200.0000mm 140.0000mm');
  await finishPrint(page);
  await dialog(page).getByLabel('Width', { exact: false }).fill('50');
  await dialog(page).getByLabel('Height', { exact: false }).fill('50');
  await expect(dialog(page)).toContainText('The design is larger than this paper.');
  await expect(dialog(page).getByRole('button', { name: 'Print', exact: true })).toBeDisabled();
  await dialog(page).getByRole('radio', { name: 'Fit to paper' }).click();
  await expect(dialog(page).getByTestId('print-summary')).toContainText('Scaled to');
  await expect(dialog(page).getByRole('button', { name: 'Print', exact: true })).toBeEnabled();
  await expect(dialog(page)).not.toContainText('The design is larger than this paper.');
  expect(await dialog(page).evaluate((node) => node.scrollWidth - node.clientWidth)).toBe(0);
});

test('Ctrl+P includes a focused edit and reopening uses the latest design', async ({ page }) => {
  await template(page);
  const editorTitle = await page.title();
  const name = page.getByRole('textbox', { name: 'Design name' });
  await name.fill('Café cards');
  await name.press('Control+p');
  await expect(dialog(page)).toBeVisible();
  await print(page);
  // The page title becomes the suggested file name for "Save as PDF".
  await expect(page).toHaveTitle('Café cards');
  await finishPrint(page);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('print-root')).toHaveCount(0);
  await expect(page).toHaveTitle(editorTitle);
  await name.fill('New cards');
  await name.press('Tab');
  await open(page);
  await print(page);
  await expect(page).toHaveTitle('New cards');
  await finishPrint(page);
});

test('downloads decodable PNG and JPG with physical resolution metadata', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await template(page);
  await open(page, 'Download');
  await dialog(page).getByRole('radio', { name: 'PNG', exact: true }).click();
  await dialog(page).getByLabel('Resolution').selectOption('150');
  const png = await download(page, info.outputPath('card.png'));
  expect(png.name).toBe('Modern business card.png');
  expect(png.bytes.readUInt32BE(16)).toBe(502);
  expect(png.bytes.readUInt32BE(20)).toBe(325);
  expect(png.bytes.readUInt32BE(png.bytes.indexOf('pHYs') + 4)).toBe(5906);
  const image = await pixels(page, png.bytes);
  expect(image.left).not.toEqual([255, 255, 255, 255]);
  await dialog(page).getByRole('radio', { name: 'JPG', exact: true }).click();
  const jpg = await download(page, info.outputPath('card.jpg'));
  expect(jpg.name).toBe('Modern business card.jpg');
  expect(jpg.bytes.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
  expect(jpg.bytes[13]).toBe(1);
  expect(jpg.bytes.readUInt16BE(14)).toBe(150);
  expect(await pixels(page, jpg.bytes, 'image/jpeg')).toMatchObject({ width: 502, height: 325 });
  expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath('download-dialog.png') });
});

test('exports all pages or the current page, with PDF trim and bleed boxes', async ({
  page,
}, info) => {
  await template(page);
  await fixture(page, 'two-pages');
  await open(page, 'Download');
  await dialog(page).getByLabel('Resolution').selectOption('150');
  await dialog(page).getByLabel('Crop marks and bleed', { exact: true }).check();
  await dialog(page).getByRole('button', { name: 'Next sheet' }).click();
  await expect(preview(page)).toContainText('SECOND PAGE');
  const pdf = await download(page, info.outputPath('two-pages.pdf'));
  expect(pdfPages(pdf.bytes)).toBe(2);
  expect(pdfSize(pdf.bytes)).toEqual([297.638, 212.598]);
  expect(pdf.bytes.toString('latin1')).toContain('/TrimBox [28.346 28.346 269.291 184.252]');
  expect(pdf.bytes.toString('latin1')).toContain('/BleedBox [19.843 19.843 277.795 192.756]');
  await dialog(page).getByRole('radio', { name: 'Current page' }).click();
  await expect(preview(page)).toContainText('Alex Morgan');
  expect(pdfPages((await download(page, info.outputPath('current-page.pdf'))).bytes)).toBe(1);
  await dialog(page).getByRole('tab', { name: 'Print', exact: true }).click();
  const root = await print(page);
  await expect(root.locator('[data-print-sheet]')).toHaveCount(2);
  await finishPrint(page);
});

test('embeds uploaded images and fills offline, preserving the crop inside bleed', async ({
  page,
  context,
}, info) => {
  await template(page);
  await page
    .getByRole('toolbar', { name: 'Design tools' })
    .getByRole('button', { name: 'Images', exact: true })
    .click();
  const choose = page.waitForEvent('filechooser');
  await page
    .getByRole('dialog', { name: 'Images' })
    .getByRole('button', { name: 'Upload from device' })
    .click();
  await (await choose).setFiles({
    name: 'photo.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#e11d48"/><circle cx="150" cy="100" r="60" fill="#facc15"/></svg>',
    ),
  });
  await expect(
    page.getByTestId('editor-page').locator('[data-element-type="image"] img'),
  ).toBeVisible();
  await fixture(page, 'photo-fill');
  await open(page, 'Download');
  await dialog(page).getByRole('radio', { name: 'PNG', exact: true }).click();
  await dialog(page).getByLabel('Resolution').selectOption('150');
  await page.evaluate(() => document.fonts.ready);
  await expect(dialog(page).getByRole('button', { name: 'Download', exact: true })).toBeEnabled();
  await context.setOffline(true);
  const png = await download(page, info.outputPath('photo.png'));
  expect(await pixels(page, png.bytes)).toMatchObject({
    left: [225, 29, 72, 255],
    centre: [250, 204, 21, 255],
  });
  const offline = await download(page, info.outputPath('photo-offline.png'));
  expect(offline.bytes.equals(png.bytes)).toBe(true);
  await dialog(page).getByRole('radio', { name: 'PDF', exact: true }).click();
  await dialog(page).getByLabel('Crop marks and bleed', { exact: true }).check();
  const frames = await preview(page)
    .locator('[data-element-type="image"]')
    .evaluateAll((nodes) => nodes.map((node) => parseFloat((node as HTMLElement).style.width)));
  // The outer ring extends; the trim artwork retains its exact original width.
  expect(frames).toHaveLength(2);
  expect(frames[0]).toBeCloseTo((91 * 96) / 25.4, 3);
  expect(frames[1]).toBeCloseTo((85 * 96) / 25.4, 3);
  const pdf = (await download(page, info.outputPath('photo-bleed.pdf'))).bytes;
  expect(pdfPages(pdf)).toBe(1);
  const stream = /\/Filter \/DCTDecode \/Length (\d+) >>\nstream\n/.exec(pdf.toString('latin1'));
  if (!stream) throw new Error('Missing PDF image');
  const start = stream.index + stream[0].length;
  const jpeg = pdf.subarray(start, start + Number(stream[1]));
  const rendered = await pixels(page, jpeg, 'image/jpeg');
  // Bleed and trim meet in an opaque red area: there must be no white clip seam.
  expect(Math.abs((rendered.lowerEdge[0] ?? 0) - 225)).toBeLessThan(15);
  expect(Math.abs((rendered.lowerEdge[1] ?? 0) - 29)).toBeLessThan(15);
  expect(Math.abs((rendered.lowerEdge[2] ?? 0) - 72)).toBeLessThan(15);
  await dialog(page).getByRole('tab', { name: 'Print', exact: true }).click();
  const root = await print(page);
  await expect(root.locator('img').first()).toHaveAttribute('src', /^blob:/);
  await finishPrint(page);
});

test('bounds large image exports and retains very large PDF page sizes', async ({ page }, info) => {
  await template(page);
  await fixture(page, 'banner');
  await open(page, 'Download');
  await expect(dialog(page)).toContainText('Reduced to');
  const pdf = await download(page, info.outputPath('banner.pdf'));
  expect(pdf.bytes.toString('latin1')).toContain('/UserUnit 5');
  expect(pdfSize(pdf.bytes)).toEqual([14400, 36]);
  const width = Number(/\/Subtype \/Image \/Width (\d+)/.exec(pdf.bytes.toString('latin1'))?.[1]);
  expect(width).toBeLessThanOrEqual(16384);
  expect(width).toBeGreaterThan(15000);
  await dialog(page).getByRole('tab', { name: 'Print', exact: true }).click();
  await dialog(page).getByRole('radio', { name: 'Poster', exact: true }).click();
  await dialog(page).getByLabel('Poster size', { exact: false }).fill('1000');
  await expect(dialog(page)).toContainText('This job exceeds the preview limit');
  await expect(dialog(page).getByRole('button', { name: 'Print', exact: true })).toBeDisabled();
});

test('reports missing images and recovers after a failed browser print', async ({ page }) => {
  await template(page);
  await open(page);
  await page.evaluate(() => {
    window.print = () => {
      throw new Error('Printing unavailable');
    };
  });
  await dialog(page).getByRole('button', { name: 'Print', exact: true }).click();
  await expect(page.getByText('Printing couldn’t start. Please try again.')).toBeVisible();
  await expect(page.getByTestId('print-root')).toHaveCount(0);
  await print(page);
  await finishPrint(page);
  await page.keyboard.press('Escape');
  await fixture(page, 'missing-photo');
  await open(page, 'Download');
  await dialog(page).getByRole('button', { name: 'Download', exact: true }).click();
  await expect(
    page.getByText(
      'The file couldn’t be created. Check that images and fonts are available, or try a lower resolution.',
    ),
  ).toBeVisible();
  await expect(dialog(page).getByRole('button', { name: 'Download', exact: true })).toBeEnabled();
});

test.describe('US paper defaults', () => {
  test.use({ locale: 'en-US' });
  test('uses Letter and inches for print settings', async ({ page }) => {
    await template(page);
    await open(page);
    await expect(dialog(page).getByLabel('Paper', { exact: true })).toHaveValue('letter');
    await expect(
      dialog(page).getByRole('spinbutton', { name: 'Space between copies (in)' }),
    ).toBeVisible();
    await expect(dialog(page).getByTestId('print-summary')).toHaveText('10 per sheet · 1 sheet');
    const root = await print(page);
    expect(await root.locator('style').textContent()).toContain('215.9000mm 279.4000mm');
    await finishPrint(page);
  });
});
