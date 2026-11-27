import { expect, test } from '@playwright/test';

test.describe('phone layout', () => {
  test.use({
    viewport: { width: 320, height: 568 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });

  test('keeps the header and download message clear of the dialog controls', async ({ page }) => {
    await page.goto('./');
    const header = page.locator('header');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    // The name keeps its space; Templates is an icon with an accessible name.
    await expect(header).toContainText('Promo Manager');
    await expect(header.getByRole('link', { name: 'Templates' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Settings' })).toBeVisible();

    await page.getByTestId('quick-create-a4').click();
    await expect(page.getByTestId('editor-canvas')).toBeVisible();
    await page.getByRole('button', { name: 'Download', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Print or download' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('radio', { name: 'PNG', exact: true }).click();
    const pending = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Download', exact: true }).click();
    await pending;

    // The success message appears at the top, leaving the dialog's button usable.
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible();
    const toastBox = await toast.boundingBox();
    const buttonBox = await dialog
      .getByRole('button', { name: 'Download', exact: true })
      .boundingBox();
    if (!toastBox || !buttonBox) throw new Error('Missing layout box');
    expect(toastBox.y).toBeLessThan(100);
    expect(toastBox.y + toastBox.height).toBeLessThanOrEqual(buttonBox.y);
    await expect(dialog.getByRole('button', { name: 'Download', exact: true })).toBeEnabled();
    expect(await dialog.evaluate((node) => node.scrollWidth - node.clientWidth)).toBe(0);
  });
});
