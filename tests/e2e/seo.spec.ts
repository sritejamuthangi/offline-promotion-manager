import { expect, test } from '@playwright/test';

const DOMAIN = 'https://opm.sritejam.com';

test('every sitemap URL returns meaningful HTML with matching canonical metadata', async ({
  request,
}) => {
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain(`Sitemap: ${DOMAIN}/sitemap.xml`);
  const sitemap = await request.get('/sitemap.xml');
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1] ?? '');
  expect(urls.length).toBeGreaterThanOrEqual(24);
  expect(new Set(urls).size).toBe(urls.length);
  for (const url of urls) {
    expect(url.startsWith(DOMAIN)).toBe(true);
    expect(url).not.toContain('#');
    const response = await request.get(new URL(url).pathname);
    expect(response.status(), url).toBe(200);
    const html = await response.text();
    expect(html, url).toContain(`rel="canonical" href="${url}"`);
    expect(html, url).toContain('name="robots" content="index, follow');
    expect(html, url).toMatch(/<h1[^>]*>[^<]+<\/h1>/);
    expect(html, url).toContain('application/ld+json');
    expect(html, url).not.toContain('<div id="root"></div>');
    expect(html, url).not.toContain('href="/#/');
    const json = /<script data-seo type="application\/ld\+json">(.*?)<\/script>/.exec(html)?.[1];
    expect(JSON.parse(json ?? '{}')['@context']).toBe('https://schema.org');
  }
});

test('template links have clean URLs, survive reload and update metadata', async ({ page }) => {
  await page.goto('/templates/category/food');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Free food and drink templates');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${DOMAIN}/templates/category/food`,
  );
  await page.getByRole('link', { name: 'Template details' }).first().click();
  await expect(page).toHaveURL(/\/templates\/restaurant-menu$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Restaurant menu');
  await expect(page).toHaveTitle(/Restaurant menu/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `${DOMAIN}/templates/restaurant-menu`,
  );
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: 'Use this template' }).click();
  await expect(page.getByTestId('editor-canvas')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  await page.reload();
  await expect(page.getByTestId('editor-canvas')).toBeVisible();
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index,/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${DOMAIN}/`);
});

test('unknown routes return 404 and local editor shells are noindex', async ({ request }) => {
  for (const path of ['/missing', '/templates/missing', '/templates/category/missing']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(await response.text()).toContain('name="robots" content="noindex, follow"');
  }
  const editor = await request.get('/design/local-id');
  expect(editor.status()).toBe(200);
  expect(await editor.text()).toContain('name="robots" content="noindex, follow"');
});

test('old hash bookmarks still open at the corresponding clean URL', async ({ page }) => {
  await page.goto('/#/templates?category=mine');
  await expect(page).toHaveURL(/\/templates\?category=mine$/);
  await expect(page.getByRole('link', { name: 'Your templates' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('public template information and links remain available without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:4173/templates/category/events');
  await page.getByRole('link', { name: 'Music festival poster', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Music festival poster');
  await expect(page.getByText('Make it your own', { exact: true })).toBeVisible();
  await context.close();
});
