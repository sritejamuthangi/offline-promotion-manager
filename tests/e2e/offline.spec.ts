import { expect, type Page, test } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

const artwork = (page: Page) => page.getByTestId('editor-page').getByTestId('page-artwork');
const panel = (page: Page) => page.getByRole('complementary', { name: 'Design panel' });

/** Waits until the service worker has saved the app and controls the page. */
async function offlineReady(page: Page) {
  await page.waitForFunction(
    async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return Boolean(registration?.active && navigator.serviceWorker.controller);
    },
    undefined,
    { timeout: 30_000 },
  );
}

/** Proves the network is gone: a file the app never saves can't load. */
const networkWorks = (page: Page) =>
  page.evaluate(() =>
    fetch('/robots.txt', { cache: 'no-store' }).then(
      () => true,
      () => false,
    ),
  );

async function addText(page: Page, value: string) {
  await page.getByRole('button', { name: 'Add text', exact: true }).click();
  if (!(await panel(page).isVisible()))
    await page.getByRole('button', { name: 'Properties', exact: true }).first().click();
  const field = panel(page).getByLabel('Text content', { exact: true });
  await field.fill(value);
  await field.press('Tab');
}

test('saves the app, then starts, edits and creates designs offline', async ({ page, context }) => {
  await page.goto('./');
  await expect(page.getByText('Ready to work offline')).toBeVisible({ timeout: 30_000 });
  await offlineReady(page);
  await page.getByTestId('quick-create-a4').click();
  await expect(page.getByTestId('editor-canvas')).toBeVisible();
  await addText(page, 'Made online');
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();

  await context.setOffline(true);
  expect(await networkWorks(page)).toBe(false);
  // Reloading an editor link starts the app from the saved files.
  await page.reload();
  await expect(artwork(page)).toContainText('Made online');
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page.getByTestId('design-card')).toHaveCount(1);

  // Screens opened directly while offline, including a new design from a template.
  await page.goto('./templates/restaurant-menu');
  await page.getByRole('button', { name: 'Use this template' }).click();
  await expect(page.getByTestId('editor-canvas')).toBeVisible();
  await expect(artwork(page).locator('[data-element-type="text"]').first()).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
  await page.goto('./settings');
  await expect(page.getByTestId('offline-status')).toContainText('Ready to work offline');
  await page.goto('./');
  await expect(page.getByTestId('design-card')).toHaveCount(2);
  await context.setOffline(false);
});

test('saves every writing-system font for use offline', async ({ page, context }) => {
  test.slow();
  await page.goto('./settings');
  await offlineReady(page);
  await page.getByRole('button', { name: 'Save all fonts' }).click();
  await expect(page.getByTestId('fonts-saved')).toBeVisible({ timeout: 90_000 });

  await context.setOffline(true);
  expect(await networkWorks(page)).toBe(false);
  await page.goto('./');
  await page.getByTestId('quick-create-a4').click();
  await expect(page.getByTestId('editor-canvas')).toBeVisible();
  await addText(page, '東京へようこそ สวัสดี');
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
        ),
      { timeout: 20_000 },
    )
    .toEqual(expect.arrayContaining(['Noto Sans JP Variable', 'Noto Sans Thai Variable']));

  // Downloads still embed the saved fonts offline.
  await page.getByRole('button', { name: 'Download', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Print or download' });
  await dialog.getByRole('radio', { name: 'PNG', exact: true }).click();
  const button = dialog.getByRole('button', { name: 'Download', exact: true });
  await expect(button).toBeEnabled();
  const download = page.waitForEvent('download');
  await button.click();
  expect((await download).suggestedFilename()).toBe('Untitled design.png');
  await context.setOffline(false);
});
