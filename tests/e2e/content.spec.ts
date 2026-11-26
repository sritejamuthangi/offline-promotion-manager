import { expect, type Locator, type Page, test } from '@playwright/test';

const artwork = (page: Page) => page.getByTestId('editor-page').getByTestId('page-artwork');
const panel = (page: Page) => page.getByRole('complementary', { name: 'Design panel' });
const toolbar = (page: Page) => page.getByRole('toolbar', { name: 'Design tools' });
const imagesDialog = (page: Page) => page.getByRole('dialog', { name: 'Images' });

async function showPanel(page: Page, name: 'Properties' | 'Layers' | 'Styles') {
  if (await panel(page).isVisible()) {
    await panel(page).getByRole('button', { name, exact: true }).click();
  } else {
    await page.getByRole('button', { name, exact: true }).first().click();
  }
  if (!(await panel(page).isVisible())) {
    await page.getByRole('button', { name, exact: true }).first().click();
  }
  await expect(panel(page)).toBeVisible();
}

async function saved(page: Page) {
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
}

async function newDesign(page: Page) {
  await page.goto('./');
  await page.getByTestId('quick-create-a4').click();
  await expect(page.getByTestId('editor-canvas')).toBeVisible();
}

async function openImages(page: Page, tab?: 'Your uploads' | 'Library' | 'Search online') {
  await toolbar(page).getByRole('button', { name: 'Images', exact: true }).click();
  await expect(imagesDialog(page)).toBeVisible();
  if (tab) await imagesDialog(page).getByRole('radio', { name: tab }).click();
}

async function uploadSvg(page: Page, button: Locator, name: string) {
  const chooser = page.waitForEvent('filechooser');
  await button.click();
  await (await chooser).setFiles({
    name,
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#0ea5e9"/></svg>',
    ),
  });
}

/** Text boxes whose lines don't fit, measured after the bundled fonts have loaded. */
async function clippedText(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-element-type="text"] > div')]
      .filter((box) => {
        const lines = (box.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0;
        return lines - box.clientHeight > 1 || box.scrollWidth - box.clientWidth > 1;
      })
      .map((box) => box.textContent),
  );
}

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const CORS = { 'access-control-allow-origin': '*' };

test('starts a design from a featured template and keeps it on the home screen', async ({
  page,
}) => {
  await page.goto('./');
  const section = page.getByRole('region', { name: 'Start from a template' });
  await section.getByRole('button', { name: 'Preview Music festival poster' }).click();
  const dialog = page.getByRole('dialog', { name: 'Music festival poster' });
  await expect(dialog).toContainText('297 × 420 mm');
  await expect(dialog).toContainText('Bebas Neue · Montserrat');
  await dialog.getByRole('button', { name: 'Use this template' }).click();

  await expect(page).toHaveURL(/\/design\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('textbox', { name: 'Design name' })).toHaveValue(
    'Music festival poster',
  );
  await expect(artwork(page)).toContainText('FESTIVAL');
  await expect(artwork(page).locator('[data-element-type="qr"]')).toHaveCount(1);
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page.getByTestId('design-card')).toHaveCount(1);
  await expect(page.getByTestId('design-card')).toContainText('Music festival poster');
});

test('filters and searches the template catalogue', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'See all templates' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Templates' })).toBeVisible();
  const cards = page.getByTestId('template-card');
  await expect(cards.first()).toBeVisible();
  const total = await cards.count();
  expect(total).toBeGreaterThanOrEqual(12);

  await page
    .getByRole('navigation', { name: 'Template categories' })
    .getByRole('link', { name: 'Food & drink' })
    .click();
  await expect(cards).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Preview Restaurant menu' })).toBeVisible();

  await page.getByRole('link', { name: 'All', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search templates' }).fill('wifi password');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Wi-Fi password sign');

  await page.getByRole('searchbox', { name: 'Search templates' }).fill('spaceship');
  await expect(page.getByText('No templates match “spaceship”.')).toBeVisible();

  await page.getByRole('searchbox', { name: 'Search templates' }).fill('');
  await page.getByRole('link', { name: 'Your templates' }).click();
  await expect(
    page.getByText(/Templates you save from your own designs appear here/),
  ).toBeVisible();
});

test('every bundled template renders without clipped text', async ({ page }) => {
  await page.goto('./templates');
  // The first visit loads the catalogue and its fonts on demand.
  await expect(page.getByTestId('template-card').first()).toBeVisible({ timeout: 15_000 });
  await page.waitForLoadState('networkidle');
  expect(await clippedText(page)).toEqual([]);
});

test.describe('in the United States', () => {
  test.use({ locale: 'en-US' });

  test('templates use US paper sizes and still fit', async ({ page }) => {
    await page.goto('./templates');
    await page.getByRole('button', { name: 'Preview Restaurant menu' }).click();
    await expect(page.getByRole('dialog', { name: 'Restaurant menu' })).toContainText(
      '8.5 × 11 in',
    );
    await page.keyboard.press('Escape');
    await page.waitForLoadState('networkidle');
    expect(await clippedText(page)).toEqual([]);
  });
});

test('applies colour palettes and font pairings in one click, with undo', async ({ page }) => {
  await newDesign(page);
  await page.getByRole('button', { name: 'Add text', exact: true }).click();
  await showPanel(page, 'Styles');
  const page$ = artwork(page);
  const text = page$.locator('[data-element-type="text"] > div').first();
  await expect(page$).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(panel(page).getByRole('button', { name: 'Use the Violet colours' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await panel(page).getByRole('button', { name: 'Use the Midnight colours' }).click();
  await expect(page$).toHaveCSS('background-color', 'rgb(15, 23, 42)');
  await expect(text).toHaveCSS('color', 'rgb(248, 250, 252)');
  await expect(
    panel(page).getByRole('button', { name: 'Use the Midnight colours' }),
  ).toHaveAttribute('aria-pressed', 'true');

  await panel(page)
    .getByRole('button', { name: /^Use the Poster fonts/ })
    .click();
  await expect(text).toHaveCSS('font-family', /Bebas Neue/);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(text).toHaveCSS('font-family', /Inter/);
  await expect(page$).toHaveCSS('background-color', 'rgb(15, 23, 42)');

  await panel(page).getByLabel('Main colour', { exact: true }).fill('#ff0000');
  await panel(page).getByLabel('Main colour', { exact: true }).blur();
  await expect(
    panel(page).getByRole('button', { name: 'Use the Midnight colours' }),
  ).toHaveAttribute('aria-pressed', 'false');
  await saved(page);
  await page.reload();
  await expect(artwork(page)).toHaveCSS('background-color', 'rgb(15, 23, 42)');
});

test('saves a design as a template and starts a new design from it', async ({ page }) => {
  await newDesign(page);
  await page.getByRole('button', { name: 'Add text', exact: true }).click();
  await showPanel(page, 'Properties');
  await panel(page).getByLabel('Text content', { exact: true }).fill('Club night');
  await panel(page).getByLabel('Text content', { exact: true }).press('Tab');

  await page.getByRole('button', { name: 'Save as template' }).click();
  const dialog = page.getByRole('dialog', { name: 'Save as template' });
  await dialog.getByLabel('Template name').fill('Club night template');
  await dialog.getByLabel('Category').selectOption('events');
  await dialog.getByRole('button', { name: 'Save template' }).click();
  await expect(page.getByText('Saved to your templates')).toBeVisible();
  await page.getByRole('button', { name: 'View', exact: true }).click();

  await expect(page).toHaveURL(/\/templates\?category=mine$/);
  await expect(page.getByRole('link', { name: 'Your templates' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.getByRole('button', { name: 'Preview Club night template' }).click();
  const preview = page.getByRole('dialog', { name: 'Club night template' });
  await expect(preview).toContainText('Saved on this device');
  await preview.getByRole('button', { name: 'Use this template' }).click();
  await expect(page.getByRole('textbox', { name: 'Design name' })).toHaveValue(
    'Club night template',
  );
  await expect(artwork(page)).toContainText('Club night');

  // Saved templates can be renamed and deleted.
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page.getByTestId('design-card')).toHaveCount(2);
  await page.goto('./templates?category=mine');
  await page.getByRole('button', { name: 'Preview Club night template' }).click();
  await page.getByRole('button', { name: 'Rename' }).click();
  await page.getByLabel('Template name').fill('Party template');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Template renamed')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Party template' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('alert')
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await expect(page.getByText('Template deleted')).toBeVisible();
  await expect(page.getByTestId('template-card')).toHaveCount(0);
});

test('adds built-in graphics and uses them as page backgrounds', async ({ page }) => {
  await newDesign(page);
  await showPanel(page, 'Properties');
  await panel(page).getByRole('button', { name: 'Choose image' }).click();
  await expect(imagesDialog(page).getByRole('radio', { name: 'Backgrounds' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await imagesDialog(page).getByRole('button', { name: 'Dots', exact: true }).click();
  await expect(imagesDialog(page)).toHaveCount(0);
  await expect(artwork(page)).toHaveCSS('background-image', /data:image\/svg\+xml/);
  await panel(page).getByLabel('Image fit', { exact: true }).selectOption('tile');
  await expect(artwork(page)).toHaveCSS('background-repeat', 'repeat');

  await openImages(page, 'Library');
  await imagesDialog(page).getByRole('button', { name: 'Confetti', exact: true }).click();
  const images = artwork(page).locator('[data-element-type="image"]');
  await expect(images).toHaveCount(1);
  const backdrop = await images.first().evaluate((node: HTMLElement) => ({
    left: node.style.left,
    top: node.style.top,
    width: Number.parseFloat(node.style.width),
  }));
  expect(backdrop.left).toBe('0px');
  expect(backdrop.top).toBe('0px');
  expect(backdrop.width).toBeCloseTo((210 * 96) / 25.4, 1);

  await openImages(page, 'Library');
  await imagesDialog(page).getByRole('radio', { name: 'Decorations' }).click();
  await imagesDialog(page).getByRole('button', { name: 'Balloons', exact: true }).click();
  await expect(images).toHaveCount(2);
  // Backgrounds go behind other elements; decorations in front.
  await expect(images.last().locator('img')).toHaveAttribute('src', /^data:image\/svg\+xml/);
  expect(
    await images.last().evaluate((node: HTMLElement) => Number.parseFloat(node.style.width)),
  ).toBeLessThan(backdrop.width);
  await saved(page);
  await page.reload();
  await expect(artwork(page).locator('[data-element-type="image"]')).toHaveCount(2);
  await expect(artwork(page)).toHaveCSS('background-repeat', 'repeat');
});

test('reuses images already uploaded on this device', async ({ page }) => {
  await newDesign(page);
  await openImages(page);
  await uploadSvg(
    page,
    imagesDialog(page).getByRole('button', { name: 'Upload from device' }),
    'logo.svg',
  );
  await expect(imagesDialog(page)).toHaveCount(0);
  await openImages(page);
  await expect(imagesDialog(page).getByRole('radio', { name: 'Your uploads' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await imagesDialog(page).getByRole('button', { name: 'logo.svg', exact: true }).click();
  const images = artwork(page).locator('[data-element-type="image"] img');
  await expect(images).toHaveCount(2);
  await expect(images.first()).toHaveAttribute('src', /^blob:/);
  expect(await images.first().getAttribute('src')).toBe(await images.last().getAttribute('src'));
});

test('finds free images online, stores the pick on this device and credits it', async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route('https://api.openverse.org/**', async (route) => {
    const url = route.request().url();
    requests.push(url);
    if (url.includes('/thumb/'))
      return route.fulfill({ contentType: 'image/png', body: PNG, headers: CORS });
    return route.fulfill({
      headers: CORS,
      json: {
        result_count: 1,
        page_count: 1,
        page: 1,
        results: [
          {
            id: 'abc',
            title: 'Sunflower',
            creator: 'Jane Doe',
            license: 'by',
            license_version: '2.0',
            license_url: 'https://creativecommons.org/licenses/by/2.0/',
            url: 'https://images.example.org/sunflower.png',
            thumbnail: 'https://api.openverse.org/v1/images/abc/thumb/',
            foreign_landing_url: 'https://example.org/sunflower',
            width: 1,
            height: 1,
          },
        ],
      },
    });
  });
  await page.route('https://images.example.org/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: PNG, headers: CORS }),
  );

  await newDesign(page);
  await openImages(page, 'Search online');
  await expect(imagesDialog(page)).toContainText('Only your search words are sent to Openverse');
  expect(requests).toEqual([]);
  await imagesDialog(page).getByLabel('Search free images').fill('sunflower');
  await imagesDialog(page).getByRole('button', { name: 'Search', exact: true }).click();
  await imagesDialog(page)
    .getByRole('button', { name: 'Add “Sunflower” by Jane Doe (CC BY 2.0)' })
    .click();
  await expect(imagesDialog(page)).toHaveCount(0);

  const search = new URL(requests[0] ?? '');
  expect(search.searchParams.get('q')).toBe('sunflower');
  expect(search.searchParams.get('license_type')).toBe('commercial,modification');
  const image = artwork(page).locator('[data-element-type="image"] img');
  await expect(image).toHaveAttribute('src', /^blob:/);
  await expect(image).toHaveAttribute('alt', 'Sunflower');

  await showPanel(page, 'Properties');
  const credit = panel(page).getByRole('region', { name: 'Credit' });
  await expect(credit).toContainText('“Sunflower” by Jane Doe (CC BY 2.0)');
  await expect(credit.getByRole('link', { name: 'Licence' })).toHaveAttribute(
    'href',
    'https://creativecommons.org/licenses/by/2.0/',
  );
  await credit.getByRole('button', { name: 'Add credit to page' }).click();
  await expect(artwork(page).locator('[data-element-type="text"]')).toHaveText(
    '“Sunflower” by Jane Doe (CC BY 2.0)',
  );
  await saved(page);
  await page.reload();
  await expect(artwork(page).locator('[data-element-type="image"] img')).toHaveAttribute(
    'src',
    /^blob:/,
  );
});

test('online image search can be turned off in Settings', async ({ page }) => {
  const requests: string[] = [];
  await page.route('https://api.openverse.org/**', (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  await page.goto('./settings');
  const toggle = page.getByLabel('Online image search');
  await expect(toggle).toBeChecked();
  await toggle.uncheck();
  await page.reload();
  await expect(page.getByLabel('Online image search')).not.toBeChecked();

  await newDesign(page);
  await openImages(page, 'Search online');
  await expect(imagesDialog(page)).toContainText('Online image search is turned off.');
  await expect(imagesDialog(page).getByLabel('Search free images')).toHaveCount(0);
  expect(requests).toEqual([]);
});

test('Wikimedia search paginates, deduplicates and keeps credits for a background', async ({
  page,
}) => {
  await page.route('https://commons.wikimedia.org/w/api.php*', (route) => {
    const offset = new URL(route.request().url()).searchParams.get('gsroffset');
    const photo = (id: number) => ({
      pageid: id,
      title: `File:Garden ${id}.png`,
      index: id,
      imageinfo: [
        {
          width: 1,
          height: 1,
          mime: 'image/png',
          url: `https://upload.wikimedia.org/garden-${id}.png`,
          thumburl: `https://upload.wikimedia.org/garden-${id}.png`,
          descriptionurl: `https://commons.wikimedia.org/wiki/File:Garden_${id}.png`,
          extmetadata: {
            Artist: { value: '<b>Sam</b>' },
            LicenseShortName: { value: 'CC BY-SA 4.0' },
            LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
          },
        },
      ],
    });
    return route.fulfill({
      headers: CORS,
      json: {
        query: { pages: offset === '0' ? [photo(1)] : [photo(1), photo(2)] },
        ...(offset === '0' ? { continue: { gsroffset: 20 } } : {}),
      },
    });
  });
  await page.route('https://upload.wikimedia.org/**', (route) =>
    route.fulfill({ contentType: 'image/png', body: PNG, headers: CORS }),
  );
  await newDesign(page);
  await showPanel(page, 'Properties');
  await panel(page).getByRole('button', { name: 'Choose image' }).click();
  await imagesDialog(page).getByRole('radio', { name: 'Search online' }).click();
  await imagesDialog(page).getByLabel('Source', { exact: true }).selectOption('wikimedia');
  await imagesDialog(page).getByLabel('Search free images').fill('garden');
  await imagesDialog(page).getByRole('button', { name: 'Search', exact: true }).click();
  await imagesDialog(page).getByRole('button', { name: 'Load more' }).click();
  await expect(imagesDialog(page).getByRole('button', { name: /^Add “Garden/ })).toHaveCount(2);
  await imagesDialog(page)
    .getByRole('button', { name: /^Add “Garden 2/ })
    .click();
  await expect(artwork(page)).toHaveCSS('background-image', /blob:/);
  await expect(panel(page).getByRole('region', { name: 'Credit' })).toContainText(
    'Sam (CC BY-SA 4.0)',
  );
  await saved(page);
  await page.reload();
  await expect(artwork(page)).toHaveCSS('background-image', /blob:/);
});

test('a rate-limited image search can be retried', async ({ page }) => {
  let calls = 0;
  await page.route('https://api.openverse.org/v1/images/*', (route) => {
    calls++;
    return calls === 1
      ? route.fulfill({ status: 429, headers: CORS, json: { detail: 'Throttled' } })
      : route.fulfill({ headers: CORS, json: { results: [], page_count: 1 } });
  });
  await newDesign(page);
  await openImages(page, 'Search online');
  await imagesDialog(page).getByLabel('Search free images').fill('flowers');
  await imagesDialog(page).getByRole('button', { name: 'Search', exact: true }).click();
  await expect(imagesDialog(page).getByRole('alert')).toContainText('Too many searches');
  await imagesDialog(page).getByRole('button', { name: 'Search', exact: true }).click();
  await expect(imagesDialog(page)).toContainText('No images found for “flowers”.');
});
