import { expect, type Page, test } from '@playwright/test';

const cards = (page: Page) => page.getByTestId('design-card');

async function openMenu(page: Page, designName: string) {
  await page.getByRole('button', { name: `More actions: ${designName}`, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('home screen introduces the app and credits the author', async ({ page }) => {
  await expect(
    page.getByRole('heading', { level: 1, name: 'Design anything. Print any size.' }),
  ).toBeVisible();
  await expect(page.getByText('No designs yet')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Built by Sriteja Muthangi' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/sritejamuthangi/',
  );
});

test('create, rename, duplicate, delete, undo and restore designs', async ({ page }) => {
  // One click creates an A4 design (the test browser uses a British locale).
  await page.getByTestId('quick-create-a4').click();
  await expect(page).toHaveURL(/#\/design\/[0-9a-f-]{36}$/);

  // Rename in place on the design page.
  const nameField = page.getByRole('textbox', { name: 'Design name' });
  await expect(nameField).toHaveValue('Untitled design');
  await nameField.fill('Summer sale poster');
  await nameField.press('Enter');
  await expect(page.getByText('Design renamed')).toBeVisible();

  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText('Summer sale poster');
  await expect(cards(page).first()).toContainText('210 × 297 mm');

  // Duplicate.
  await openMenu(page, 'Summer sale poster');
  await page.getByRole('menuitem', { name: 'Duplicate' }).click();
  await expect(cards(page)).toHaveCount(2);

  // Rename the copy through the dialog.
  await openMenu(page, 'Summer sale poster (copy)');
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  const dialog = page.getByRole('dialog', { name: 'Rename design' });
  await dialog.getByLabel('Design name').fill('Flyer');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  await expect(cards(page).filter({ hasText: 'Flyer' })).toHaveCount(1);

  // Delete, then undo from the toast.
  await openMenu(page, 'Flyer');
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(cards(page)).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(cards(page)).toHaveCount(2);

  // Delete again, then restore from Recently deleted.
  await openMenu(page, 'Flyer');
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(cards(page)).toHaveCount(1);
  await page.getByText('Recently deleted', { exact: true }).click();
  await page.getByRole('button', { name: 'Restore: Flyer' }).click();
  await expect(cards(page)).toHaveCount(2);

  // Everything is still there after a reload (saved in IndexedDB).
  await page.reload();
  await expect(cards(page)).toHaveCount(2);
  await expect(cards(page).filter({ hasText: 'Summer sale poster' })).toHaveCount(1);
});

test('delete forever asks for confirmation', async ({ page }) => {
  await page.getByTestId('quick-create-a5').click();
  await page.getByRole('link', { name: 'Back to home' }).click();
  await openMenu(page, 'Untitled design');
  await page.getByRole('menuitem', { name: 'Delete' }).click();

  await page.getByText('Recently deleted', { exact: true }).click();
  await page.getByRole('button', { name: 'Delete forever: Untitled design' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete forever?' });
  await confirm.getByRole('button', { name: 'Delete forever' }).click();
  await expect(page.getByText('Design deleted forever')).toBeVisible();
  await expect(page.getByText('Recently deleted', { exact: true })).toHaveCount(0);
});

test('custom sizes are created exactly and invalid sizes are refused', async ({ page }) => {
  await page.getByTestId('more-sizes').click();
  const dialog = page.getByRole('dialog', { name: 'Create a design' });

  await dialog.getByLabel('Width').fill('0');
  await dialog.getByRole('button', { name: 'Create design' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Enter a width and height between');

  await dialog.getByLabel('Width').fill('100');
  await dialog.getByLabel('Height').fill('50');
  await dialog.getByRole('button', { name: 'Create design' }).click();
  await expect(page).toHaveURL(/#\/design\//);
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(cards(page).first()).toContainText('100 × 50 mm');
});

test('presets can be rotated to landscape', async ({ page }) => {
  await page.getByTestId('more-sizes').click();
  const dialog = page.getByRole('dialog', { name: 'Create a design' });
  await dialog.getByRole('radio', { name: 'Posters & flyers' }).click();
  await dialog.getByRole('radio', { name: 'Landscape' }).click();
  await dialog.getByTestId('preset-poster-a2').click();
  await expect(page).toHaveURL(/#\/design\//);
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(cards(page).first()).toContainText('594 × 420 mm');
});

test('theme choice is applied and remembered', async ({ page }) => {
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await page.getByRole('radio', { name: 'Light' }).click();
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
});

test('about dialog explains privacy and credits the author', async ({ page }) => {
  await page.getByRole('button', { name: 'About', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'About Offline Promotion Manager' });
  await expect(dialog).toContainText('No account, no tracking, no ads.');
  await expect(dialog.getByRole('link', { name: 'Sriteja Muthangi' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/sritejamuthangi/',
  );
});

test('unknown pages and designs show a helpful message', async ({ page }) => {
  await page.goto('./#/no-such-page');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.goto('./#/design/does-not-exist');
  await expect(page.getByRole('heading', { name: 'Design not found' })).toBeVisible();
});

test.describe('in the United States', () => {
  test.use({ locale: 'en-US' });

  test('suggests US Letter and inches', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByTestId('quick-create-letter')).toBeVisible();
    await expect(page.getByTestId('quick-create-a4')).toHaveCount(0);
    await expect(page.getByTestId('quick-create-letter')).toContainText('8.5 × 11 in');
  });
});
