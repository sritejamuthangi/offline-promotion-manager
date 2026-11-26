import { expect, type Locator, type Page, test } from '@playwright/test';

const artwork = (page: Page) => page.getByTestId('editor-page').getByTestId('page-artwork');
const elements = (page: Page) => artwork(page).locator('[data-element-id]');
const canvas = (page: Page) => page.getByTestId('editor-canvas');
const panel = (page: Page) => page.getByRole('complementary', { name: 'Design panel' });

async function showPanel(page: Page, name: 'Properties' | 'Layers') {
  if (await panel(page).isVisible()) {
    await panel(page).getByRole('button', { name, exact: true }).click();
  } else {
    await page.getByRole('button', { name, exact: true }).first().click();
  }
  // The panel can briefly unmount while a dialog closes; click again if it did.
  if (!(await panel(page).isVisible())) {
    await page.getByRole('button', { name, exact: true }).first().click();
  }
  await expect(panel(page)).toBeVisible();
}

async function hidePanel(page: Page) {
  if (await panel(page).isVisible())
    await page.getByRole('button', { name: 'Close panel' }).click();
}

async function shape(page: Page, name = 'Rectangle') {
  await expect(page.getByRole('menu')).toHaveCount(0);
  await page.getByRole('button', { name: 'Shapes', exact: true }).click();
  await page.getByRole('menuitem', { name, exact: true }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
}

async function number(page: Page, name: string, value: number) {
  const input = panel(page).getByRole('spinbutton', { name: new RegExp(`^${name}( |$)`) });
  await input.fill(String(value));
  await input.press('Enter');
}

async function bounds(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Expected a visible element');
  return box;
}

async function frame(locator: Locator) {
  return locator.evaluate((node: HTMLElement) => ({
    x: Number.parseFloat(node.style.left),
    y: Number.parseFloat(node.style.top),
    width: Number.parseFloat(node.style.width),
    height: Number.parseFloat(node.style.height),
    rotation: Number.parseFloat(node.style.transform.replace('rotate(', '')),
  }));
}

async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
}

async function saved(page: Page) {
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeVisible();
}

const toolbar = (page: Page) => page.getByRole('toolbar', { name: 'Design tools' });

const svgFile = (label: string) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#f97316"/><text x="12" y="48" font-family="sans-serif" font-size="22" fill="#ffffff">${label}</text></svg>`,
  );

async function uploadImage(page: Page, button: Locator, name: string, label = 'Art') {
  const chooser = page.waitForEvent('filechooser');
  await button.click();
  await (await chooser).setFiles({
    name,
    mimeType: 'image/svg+xml',
    buffer: svgFile(label),
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.getByTestId('quick-create-a4').click();
  await expect(canvas(page)).toBeVisible();
});

test('edits multilingual text inline, undoes one edit, autosaves and renders a thumbnail', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.getByRole('button', { name: 'Add text', exact: true }).click();
  await hidePanel(page);
  const text = elements(page).first();
  await text.dblclick();
  const input = page.getByRole('textbox', { name: 'Edit text on canvas' });
  await expect(input).toBeVisible();
  await input.fill('Hello · నమస్తే · مرحبا');
  await input.press('Control+Enter');
  await expect(text).toHaveText('Hello · నమస్తే · مرحبا');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(text).toHaveText('Your text here');
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  await saved(page);
  await page.reload();
  await expect(elements(page).first()).toHaveText('Hello · నమస్తే · مرحبا');
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page.getByTestId('design-card').getByTestId('page-artwork')).toContainText(
    'Hello · నమస్తే · مرحبا',
  );
  expect(errors).toEqual([]);
});

test('moves, resizes and rotates with single-step undo and snapping guides', async ({ page }) => {
  await shape(page);
  await hidePanel(page);
  const element = elements(page).first();
  const initial = await frame(element);
  const box = await bounds(element);
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await drag(page, start, { x: start.x + 50, y: start.y + 40 });
  const moved = await frame(element);
  expect(moved.x).toBeGreaterThan(initial.x + 20);
  expect(moved.y).toBeGreaterThan(initial.y + 20);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await frame(element)).toEqual(initial);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  expect(await frame(element)).toEqual(moved);

  const handle = await bounds(
    page.getByRole('button', { name: 'Resize bottom right', exact: true }),
  );
  const corner = { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 };
  await drag(page, corner, { x: corner.x + 25, y: corner.y + 35 });
  const resized = await frame(element);
  expect(resized.width).toBeGreaterThan(moved.width);
  expect(resized.height).toBeGreaterThan(moved.height);
  expect(resized.x).toBeCloseTo(moved.x, 3);
  expect(resized.y).toBeCloseTo(moved.y, 3);

  const rotation = await bounds(page.getByRole('button', { name: 'Rotate selection' }));
  const selected = await bounds(element);
  const pivot = { x: selected.x + selected.width / 2, y: selected.y + selected.height / 2 };
  const radius = pivot.y - rotation.y - rotation.height / 2;
  await drag(
    page,
    { x: rotation.x + rotation.width / 2, y: rotation.y + rotation.height / 2 },
    { x: pivot.x + radius, y: pivot.y },
  );
  expect((await frame(element)).rotation).toBeCloseTo(90, 0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await frame(element)).toEqual(resized);

  // Move the centre just within the on-screen snap threshold of the page centre.
  const paper = await bounds(page.getByTestId('editor-page'));
  const current = await bounds(element);
  await page.mouse.move(current.x + current.width / 2, current.y + current.height / 2);
  await page.mouse.down();
  await page.mouse.move(paper.x + paper.width / 2 + 2, paper.y + paper.height / 2 + 2, {
    steps: 6,
  });
  await expect(page.getByTestId('snap-guide').first()).toBeVisible();
  await page.mouse.up();
  const snapped = await bounds(element);
  expect(snapped.x + snapped.width / 2).toBeCloseTo(paper.x + paper.width / 2, 0);
  expect(snapped.y + snapped.height / 2).toBeCloseTo(paper.y + paper.height / 2, 0);
});

test('uses precise properties, gradient fills and line endpoints', async ({ page }, testInfo) => {
  await shape(page, 'Star');
  await showPanel(page, 'Properties');
  await number(page, 'Width', 60);
  await number(page, 'Height', 60);
  await number(page, 'X position', 25);
  await number(page, 'Rotation', 15);
  await panel(page).getByLabel('Fill', { exact: true }).selectOption('linear');
  await panel(page).getByLabel('Start colour', { exact: true }).fill('#ff8844');
  await panel(page).getByLabel('End colour', { exact: true }).fill('#6d28d9');
  await panel(page).getByRole('heading').first().click();
  expect((await frame(elements(page).first())).width).toBeCloseTo((60 * 96) / 25.4);
  await expect(artwork(page).locator('linearGradient stop').first()).toHaveAttribute(
    'stop-color',
    '#ff8844',
  );

  await page.getByRole('button', { name: 'Add line', exact: true }).click();
  await panel(page).getByLabel('Line end', { exact: true }).selectOption('arrow');
  await hidePanel(page);
  const line = artwork(page).locator('[data-element-type="line"]');
  const before = await frame(line);
  const handle = await bounds(page.getByRole('button', { name: 'Move line end' }));
  const point = { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 };
  await drag(page, point, { x: point.x + 25, y: point.y + 50 });
  expect((await frame(line)).rotation).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await frame(line)).toEqual(before);
  await saved(page);
  await page.screenshot({ path: testInfo.outputPath('editor.png'), fullPage: true });
});

test('reorders, hides and locks layers, then restores deleted elements', async ({ page }) => {
  await shape(page);
  await shape(page, 'Ellipse');
  const rectangleId = await elements(page).first().getAttribute('data-element-id');
  const ellipseId = await elements(page).last().getAttribute('data-element-id');
  await showPanel(page, 'Layers');
  await panel(page).getByRole('button', { name: 'Backward', exact: true }).click();
  await expect(elements(page).first()).toHaveAttribute('data-element-id', ellipseId ?? 'missing');
  await expect(elements(page).last()).toHaveAttribute('data-element-id', rectangleId ?? 'missing');
  await panel(page).getByRole('button', { name: 'Hide Ellipse', exact: true }).click();
  await expect(elements(page)).toHaveCount(1);
  await panel(page).getByRole('button', { name: 'Show Ellipse', exact: true }).click();
  await panel(page).getByRole('button', { name: 'Lock Ellipse', exact: true }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(elements(page)).toHaveCount(2);
  await showPanel(page, 'Layers');
  await panel(page).getByRole('button', { name: 'Unlock Ellipse', exact: true }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(elements(page)).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(elements(page)).toHaveCount(2);
});

test('selects multiple elements, aligns, duplicates and nudges via keyboard', async ({ page }) => {
  await shape(page);
  await showPanel(page, 'Properties');
  await number(page, 'X position', 20);
  await shape(page, 'Ellipse');
  await number(page, 'X position', 110);
  await hidePanel(page);
  await canvas(page).focus();
  await page.keyboard.press('Control+a');
  await showPanel(page, 'Properties');
  await expect(panel(page).getByRole('heading', { name: '2 elements selected' })).toBeVisible();
  await panel(page).getByRole('button', { name: 'Align top', exact: true }).click();
  expect((await frame(elements(page).first())).y).toBeCloseTo(
    (await frame(elements(page).last())).y,
  );
  await hidePanel(page);
  await canvas(page).focus();
  await page.keyboard.press('Control+d');
  await expect(elements(page)).toHaveCount(4);
  const before = await frame(elements(page).last());
  await page.keyboard.press('Shift+ArrowRight');
  expect((await frame(elements(page).last())).x).toBeCloseTo(before.x + 10);
  await page.keyboard.press('Control+z');
  expect((await frame(elements(page).last())).x).toBeCloseTo(before.x);

  // Empty-space marquee also selects the full group.
  await page.keyboard.press('Escape');
  const paper = await bounds(page.getByTestId('editor-page'));
  await drag(
    page,
    { x: paper.x + 2, y: paper.y + 2 },
    { x: paper.x + paper.width - 2, y: paper.y + paper.height - 15 },
  );
  await showPanel(page, 'Properties');
  await expect(panel(page).getByRole('heading', { name: '4 elements selected' })).toBeVisible();
});

test('flushes the latest focused edit when navigating home', async ({ page }) => {
  await page.getByRole('button', { name: 'Add text', exact: true }).click();
  await showPanel(page, 'Properties');
  await panel(page).getByLabel('Text content', { exact: true }).fill('Saved while leaving');
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page.getByTestId('design-card').getByTestId('page-artwork')).toContainText(
    'Saved while leaving',
  );
  await page.reload();
  await expect(page.getByTestId('design-card').getByTestId('page-artwork')).toContainText(
    'Saved while leaving',
  );
});

test('keeps both versions when two tabs edit the same design', async ({ page, context }) => {
  const other = await context.newPage();
  await other.goto(page.url());
  await expect(canvas(other)).toBeVisible();
  await page.getByRole('button', { name: 'Add text', exact: true }).click();
  await saved(page);
  await shape(other);
  await expect(other.getByRole('alert')).toContainText('This design changed in another tab');
  await other.getByRole('button', { name: 'Save as a copy' }).click();
  await expect(other).not.toHaveURL(page.url());
  await expect(elements(other)).toHaveCount(1);
  await other.getByRole('link', { name: 'Back to home' }).click();
  await expect(other.getByTestId('design-card')).toHaveCount(2);
  await page.reload();
  await expect(elements(page).first()).toHaveText('Your text here');
  await other.close();
});

test('recovers an open design after another tab deletes it', async ({ page, context }) => {
  await page.getByRole('button', { name: 'Add text', exact: true }).click();
  await saved(page);
  const other = await context.newPage();
  await other.goto('./');
  await other.getByRole('button', { name: 'More actions: Untitled design', exact: true }).click();
  await other.getByRole('menuitem', { name: 'Delete', exact: true }).click();
  await expect(other.getByTestId('design-card')).toHaveCount(0);
  await expect(elements(page)).toHaveCount(1);
  await showPanel(page, 'Properties');
  await panel(page).getByLabel('Text content', { exact: true }).fill('Recovered work');
  await page.getByRole('button', { name: 'Close panel' }).click();
  await expect(page.getByRole('alert')).toContainText('This design was deleted in another tab');
  await page.getByRole('button', { name: 'Save as a copy' }).click();
  await expect(elements(page).first()).toHaveText('Recovered work');
  await saved(page);
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page.getByTestId('design-card')).toHaveCount(1);
  await expect(page.getByTestId('design-card')).toContainText('Recovered work');
  await other.close();
});

test('preserves manual zoom during edits and cancels an unfinished drag', async ({ page }) => {
  await shape(page);
  await hidePanel(page);
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  const paperBefore = await bounds(page.getByTestId('editor-page'));
  await canvas(page).focus();
  await page.keyboard.press('ArrowRight');
  expect(await bounds(page.getByTestId('editor-page'))).toEqual(paperBefore);
  const element = elements(page).first();
  const original = await frame(element);
  const box = await bounds(element);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 40, { steps: 4 });
  expect((await frame(element)).x).toBeGreaterThan(original.x);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  expect(await frame(element)).toEqual(original);
});

test('touch dragging and two-finger zoom preserve the artwork', async ({
  page,
  context,
  isMobile,
}) => {
  test.skip(!isMobile, 'Real touch input is exercised on the phone project');
  await shape(page);
  const element = elements(page).first();
  const original = await frame(element);
  const box = await bounds(element);
  const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...centre, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: centre.x + 25, y: centre.y + 35, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await frame(element)).x).toBeGreaterThan(original.x);
  const moved = await frame(element);
  const zoom = Number.parseFloat((await page.getByTestId('zoom-level').textContent()) ?? '0');
  const surface = await bounds(canvas(page));
  const middle = { x: surface.width / 2, y: surface.y + surface.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: middle.x - 45, y: middle.y, id: 1 },
      { x: middle.x + 45, y: middle.y, id: 2 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { x: middle.x - 90, y: middle.y + 20, id: 1 },
      { x: middle.x + 90, y: middle.y + 20, id: 2 },
    ],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect
    .poll(async () =>
      Number.parseFloat((await page.getByTestId('zoom-level').textContent()) ?? '0'),
    )
    .toBeGreaterThan(zoom * 1.8);
  expect(await frame(element)).toEqual(moved);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect(await frame(element)).toEqual(original);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()?.width ?? 0,
  );
});

test('uploads an image locally and restores it from IndexedDB after reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await toolbar(page).getByRole('button', { name: 'Images', exact: true }).click();
  await uploadImage(
    page,
    page
      .getByRole('dialog', { name: 'Images' })
      .getByRole('button', { name: 'Upload from device' }),
    'swatch.svg',
    'Local',
  );
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const image = artwork(page).locator('[data-element-type="image"] img');
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('src', /^blob:/);
  await saved(page);

  await page.reload();
  const restored = artwork(page).locator('[data-element-type="image"] img');
  await expect(restored).toBeVisible();
  await expect(restored).toHaveAttribute('src', /^blob:/);
  await expect(restored).toHaveAttribute('alt', 'swatch.svg');
  expect(errors).toEqual([]);
});

test('creates URL and Wi-Fi QR codes and edits their payload in Properties', async ({ page }) => {
  await toolbar(page).getByRole('button', { name: 'QR code', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'QR code' })).toBeVisible();
  await dialog.getByLabel('Website address', { exact: true }).fill('example.com');
  await dialog.getByRole('button', { name: 'Add QR code', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const first = artwork(page).locator('[data-element-type="qr"]');
  await expect(first).toBeVisible();
  expect(await first.locator('svg rect').count()).toBeGreaterThan(20);
  await showPanel(page, 'Properties');
  await expect(panel(page).getByRole('heading', { name: 'QR code' })).toBeVisible();
  await expect(panel(page).getByLabel('QR content', { exact: true })).toHaveValue(
    'https://example.com',
  );

  await panel(page).getByLabel('QR content', { exact: true }).fill('https://example.org');
  await panel(page).getByLabel('QR content', { exact: true }).press('Tab');
  await expect(first.locator('svg rect').first()).toBeVisible();
  await saved(page);

  await toolbar(page).getByRole('button', { name: 'QR code', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Type', { exact: true }).selectOption('wifi');
  await dialog.getByLabel('Network name (SSID)', { exact: true }).fill('Cafe Guest');
  await dialog.getByLabel('Password', { exact: true }).fill('secret');
  await dialog.getByRole('button', { name: 'Add QR code', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(artwork(page).locator('[data-element-type="qr"]')).toHaveCount(2);
  await expect(panel(page).getByLabel('QR content', { exact: true })).toHaveValue(
    'WIFI:T:WPA;S:Cafe Guest;P:secret;;',
  );
  await saved(page);

  await page.reload();
  await expect(artwork(page).locator('[data-element-type="qr"]')).toHaveCount(2);
});

test('adds icons and stickers from the Elements dialog', async ({ page }) => {
  await toolbar(page).getByRole('button', { name: 'Elements', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Star', exact: true }).click();
  await expect(artwork(page).locator('[data-element-type="icon"] svg')).toBeVisible();

  await toolbar(page).getByRole('button', { name: 'Elements', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Stickers', exact: true }).click();
  await dialog.getByRole('button', { name: 'Burst', exact: true }).click();
  await expect(artwork(page).locator('[data-element-type="sticker"] svg path')).toBeVisible();
  await saved(page);

  await page.reload();
  await expect(artwork(page).locator('[data-element-type="icon"]')).toHaveCount(1);
  await expect(artwork(page).locator('[data-element-type="sticker"]')).toHaveCount(1);
});

test('edits Smart Grid items, columns, rows and logos', async ({ page }) => {
  await toolbar(page).getByRole('button', { name: 'Smart Grid', exact: true }).click();
  const grid = artwork(page).locator('[data-element-type="grid"]');
  await expect(grid).toBeVisible();
  await expect(grid).toContainText('Design');

  await showPanel(page, 'Properties');
  await expect(panel(page).getByRole('heading', { name: 'Smart Grid' })).toBeVisible();
  await panel(page).getByLabel('Name 1', { exact: true }).fill('Alpha');
  await panel(page).getByLabel('Subtitle (optional) 1', { exact: true }).fill('Design studio');
  await expect(grid).toContainText('Alpha');
  await expect(grid).toContainText('Design studio');

  await panel(page).getByRole('button', { name: 'Add item', exact: true }).click();
  await expect(panel(page).getByLabel(/^Name \d+$/)).toHaveCount(6);
  await panel(page).getByLabel('Cards per row', { exact: true }).selectOption('2');
  await expect(grid.locator(':scope > div > div')).toHaveCount(3);

  await uploadImage(
    page,
    panel(page).getByRole('button', { name: 'Add logo', exact: true }).first(),
    'logo.svg',
    'L',
  );
  await expect(grid.locator('img')).toBeVisible();
  await saved(page);

  await page.reload();
  const restored = artwork(page).locator('[data-element-type="grid"]');
  await expect(restored).toContainText('Alpha');
  await expect(restored).toContainText('Design studio');
  await expect(restored.locator('img')).toBeVisible();
  await expect(restored.locator(':scope > div > div')).toHaveCount(3);
});

test('applies letter spacing, case, outline, shadow and vertical alignment to text', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Add text', exact: true }).click();
  await showPanel(page, 'Properties');
  await panel(page).getByLabel('Text content', { exact: true }).fill('Styled text');
  const spacing = panel(page).getByRole('spinbutton', { name: /^Letter spacing/ });
  await spacing.fill('0.1');
  await spacing.press('Enter');
  await panel(page).getByLabel('Letter case', { exact: true }).selectOption('uppercase');
  await panel(page).getByLabel('Vertical alignment', { exact: true }).selectOption('bottom');
  await panel(page).getByLabel('Text outline', { exact: true }).check();
  await panel(page).getByLabel('Shadow', { exact: true }).check();

  const text = artwork(page).locator('[data-element-type="text"] > div').first();
  await expect(text).toHaveAttribute('style', /letter-spacing: 0\.1em/);
  await expect(text).toHaveAttribute('style', /text-transform: uppercase/);
  await expect(text).toHaveAttribute('style', /-webkit-text-stroke: 2px/);
  await expect(text).toHaveAttribute('style', /text-shadow:/);
  await expect(text).toHaveAttribute('style', /justify-content: flex-end/);
  await saved(page);

  await page.reload();
  const restored = artwork(page).locator('[data-element-type="text"] > div').first();
  await expect(restored).toHaveAttribute('style', /letter-spacing: 0\.1em/);
  await expect(restored).toHaveAttribute('style', /text-transform: uppercase/);
  await expect(restored).toHaveAttribute('style', /-webkit-text-stroke: 2px/);
  await expect(restored).toHaveAttribute('style', /text-shadow:/);
});
