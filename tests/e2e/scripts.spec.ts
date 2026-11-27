import { expect, type Page, test } from '@playwright/test';

const artwork = (page: Page) => page.getByTestId('editor-page').getByTestId('page-artwork');
const panel = (page: Page) => page.getByRole('complementary', { name: 'Design panel' });
const printDialog = (page: Page) => page.getByRole('dialog', { name: 'Print or download' });

async function showProperties(page: Page) {
  if (!(await panel(page).isVisible()))
    await page.getByRole('button', { name: 'Properties', exact: true }).first().click();
  await expect(panel(page)).toBeVisible();
}

/** Whether the writing-system font stylesheet has been downloaded. */
const scriptStylesLoaded = (page: Page) =>
  page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .some((entry) => /\/scriptFonts-[\w-]+\.css$/.test(entry.name)),
  );

const loadedFamilies = (page: Page) =>
  page.evaluate(() =>
    [...document.fonts].filter((font) => font.status === 'loaded').map((font) => font.family),
  );

test('draws other writing systems with bundled fonts, and exports them', async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('quick-create-a4').click();
  await expect(page.getByTestId('editor-canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Add text', exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  // Latin-only designs never download the writing-system fonts.
  expect(await scriptStylesLoaded(page)).toBe(false);

  await showProperties(page);
  const field = panel(page).getByLabel('Text content', { exact: true });
  await field.fill('Hello నమస్తే 東京へようこそ مرحبا');
  await field.press('Tab');
  const text = artwork(page).locator('[data-element-type="text"] > div').first();
  // The text's own writing systems come first, in order; kana make Chinese characters Japanese.
  await expect(text).toHaveCSS(
    'font-family',
    /Inter Variable.*Noto Sans Telugu Variable.*Noto Sans JP Variable.*Noto Sans Arabic Variable.*Noto Sans SC Variable/,
  );
  await expect
    .poll(() => loadedFamilies(page), { timeout: 20_000 })
    .toEqual(
      expect.arrayContaining([
        'Noto Sans Telugu Variable',
        'Noto Sans JP Variable',
        'Noto Sans Arabic Variable',
      ]),
    );
  await expect(
    panel(page).locator('optgroup[label="World scripts (included)"] > option', {
      hasText: 'Noto Sans Telugu · తెలుగు',
    }),
  ).toHaveCount(1);

  // Record the font files the export embeds.
  await page.evaluate(() => {
    const fetches: string[] = [];
    (window as unknown as { fontFetches: string[] }).fontFetches = fetches;
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.endsWith('.woff2')) fetches.push(url.split('/').pop() ?? url);
      return original(input, init);
    };
  });
  await page.getByRole('button', { name: 'Download', exact: true }).first().click();
  await printDialog(page).getByRole('radio', { name: 'PNG', exact: true }).click();
  const button = printDialog(page).getByRole('button', { name: 'Download', exact: true });
  await expect(button).toBeEnabled();
  const pending = page.waitForEvent('download');
  await button.click();
  expect((await pending).suggestedFilename()).toBe('Untitled design.png');
  const embedded = await page.evaluate(
    () => (window as unknown as { fontFetches: string[] }).fontFetches,
  );
  const has = (pattern: RegExp) => embedded.some((name) => pattern.test(name));
  expect(has(/^noto-sans-telugu-telugu-/)).toBe(true);
  expect(has(/^noto-sans-jp-\d+-/)).toBe(true);
  expect(has(/^noto-sans-arabic-arabic-/)).toBe(true);
  // Only the faces that draw the text: not the fallbacks' Latin, nor other Chinese styles.
  expect(has(/^noto-sans-\w+-latin/)).toBe(false);
  expect(has(/^noto-sans-(sc|tc|kr)-/)).toBe(false);
});
