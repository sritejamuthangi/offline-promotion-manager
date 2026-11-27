import { readFile, writeFile } from 'node:fs/promises';
import { expect, type Page, test } from '@playwright/test';

const card = (page: Page) => page.getByTestId('backup-card');
const restoreDialog = (page: Page) => page.getByRole('dialog', { name: 'Restore this file?' });

/** Empties the library the way a cleared browser would, keeping the app's connection open. */
async function clearLibrary(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('offline-promotion-manager');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(['designs', 'templates', 'assets'], 'readwrite');
          transaction.objectStore('designs').clear();
          transaction.objectStore('templates').clear();
          transaction.objectStore('assets').clear();
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      }),
  );
}

test('downloads a backup and restores designs, templates and images after the device is cleared', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // A design with an uploaded image, saved as a template.
  await page.goto('./');
  await page.getByTestId('quick-create-a4').click();
  const name = page.getByRole('textbox', { name: 'Design name' });
  await name.fill('Backup poster');
  await name.press('Enter');
  await expect(page.getByText('Design renamed')).toBeVisible();

  await page
    .getByRole('toolbar', { name: 'Design tools' })
    .getByRole('button', { name: 'Images', exact: true })
    .click();
  const images = page.getByRole('dialog', { name: 'Images' });
  const chooser = page.waitForEvent('filechooser');
  await images.getByRole('button', { name: 'Upload from device' }).click();
  await (await chooser).setFiles({
    name: 'backup-photo.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#7c3aed"/></svg>',
    ),
  });
  await expect(
    page.getByTestId('editor-page').locator('[data-element-type="image"] img'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Save as template' }).click();
  const save = page.getByRole('dialog', { name: 'Save as template' });
  await save.getByLabel('Template name').fill('Backup template');
  await save.getByLabel('Category').selectOption('business');
  await save.getByRole('button', { name: 'Save template' }).click();
  await expect(page.getByText('Saved to your templates')).toBeVisible();

  // A second design, deleted, so the backup must carry Recently deleted too.
  await page.getByRole('link', { name: 'Back to home' }).click();
  await page.getByTestId('quick-create-a4').click();
  const second = page.getByRole('textbox', { name: 'Design name' });
  await second.fill('Deleted flyer');
  await second.press('Enter');
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page.getByTestId('design-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'More actions: Deleted flyer', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.getByTestId('design-card')).toHaveCount(1);

  // Download the backup from Settings.
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(card(page)).toBeVisible();
  const pending = page.waitForEvent('download');
  await card(page).getByRole('button', { name: 'Download backup' }).click();
  const backup = await pending;
  expect(backup.suggestedFilename()).toMatch(
    /^offline-promotion-manager-backup-\d{4}-\d{2}-\d{2}\.zip$/,
  );
  const file = info.outputPath('backup.zip');
  await backup.saveAs(file);
  await expect(page.getByText('Backup downloaded')).toBeVisible();

  const bytes = await readFile(file);
  expect(bytes.subarray(0, 2).toString()).toBe('PK');
  const contents = bytes.toString('latin1');
  expect(contents).toContain('backup.json');
  expect(contents).toContain('README.txt');
  expect(contents).toContain('images/');
  expect(contents).toContain('.svg');

  // Clear the library, then confirm the home screen is empty.
  await clearLibrary(page);
  await page.goto('./');
  await expect(page.getByText('No designs yet')).toBeVisible();

  // Restore the file.
  await page.goto('./settings');
  await page.getByTestId('backup-file').setInputFiles(file);
  const confirm = restoreDialog(page);
  await expect(confirm).toBeVisible();
  const value = (label: string) => confirm.locator(`dt:text-is("${label}") + dd`);
  await expect(value('Designs to add')).toHaveText('2');
  await expect(value('Templates to add')).toHaveText('1');
  await expect(value('Images to add')).toHaveText('1');
  await expect(value('Already on this device')).toHaveText('0');
  await confirm.getByTestId('restore-confirm').click();
  await expect(page.getByText('Restored: 2 designs and 1 template')).toBeVisible();
  await expect(confirm).toBeHidden();

  // Both designs, the saved template and the image are back.
  await page.goto('./');
  await expect(page.getByTestId('design-card')).toHaveCount(2);
  await expect(page.getByTestId('design-card').filter({ hasText: 'Backup poster' })).toHaveCount(1);
  await expect(page.getByTestId('design-card').filter({ hasText: 'Deleted flyer' })).toHaveCount(1);

  await page.goto('./templates?category=mine');
  await expect(page.getByTestId('template-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Preview Backup template' }).click();
  const preview = page.getByRole('dialog', { name: 'Backup template' });
  await preview.getByRole('button', { name: 'Use this template' }).click();
  await expect(
    page.getByTestId('editor-page').locator('[data-element-type="image"] img'),
  ).toHaveAttribute('src', /^blob:/);
  await page
    .getByRole('toolbar', { name: 'Design tools' })
    .getByRole('button', { name: 'Images', exact: true })
    .click();
  const uploads = page.getByRole('dialog', { name: 'Images' });
  await uploads.getByRole('radio', { name: 'Your uploads' }).click();
  await expect(
    uploads.getByRole('button', { name: 'backup-photo.svg', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  // Restoring the same file again changes nothing.
  await page.goto('./settings');
  await page.getByTestId('backup-file').setInputFiles(file);
  const again = restoreDialog(page);
  await expect(again).toContainText('Everything in this file is already on this device.');
  await again.getByRole('button', { name: 'Cancel' }).click();
  await expect(again).toBeHidden();

  expect(errors).toEqual([]);
});

test('refuses files that are not backups and stays ready to try again', async ({ page }, info) => {
  await page.goto('./settings');
  const file = info.outputPath('notes.zip');
  await writeFile(file, 'These are not backup bytes.');

  await page.getByTestId('backup-file').setInputFiles(file);
  await expect(card(page).getByRole('alert')).toHaveText(
    'This isn’t an Offline Promotion Manager backup or design file.',
  );
  await expect(card(page).getByRole('button', { name: 'Download backup' })).toBeEnabled();
  await expect(card(page).locator('button', { hasText: 'Restore file' })).toBeEnabled();
});
