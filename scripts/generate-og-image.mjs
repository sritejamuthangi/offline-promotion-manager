/**
 * Renders the social preview image in public/og-image.png (1200x630) from an inline card.
 * Not part of the build: run it after changing the artwork. It uses Playwright's browser; set
 * PW_CHANNEL=msedge (or chrome) to reuse an installed browser.
 *
 *   node scripts/generate-og-image.mjs
 */
import { chromium } from '@playwright/test';

const html = `<!doctype html>
<html>
<head>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    width: 1200px;
    height: 630px;
    font-family: "Segoe UI", Arial, Helvetica, sans-serif;
    background: #0b1020;
    color: #f8fafc;
    overflow: hidden;
  }
  .bg { position: absolute; inset: 0; background: radial-gradient(1100px 560px at 8% -8%, rgba(139, 92, 246, 0.5), transparent 60%), radial-gradient(900px 520px at 100% 108%, rgba(251, 113, 133, 0.45), transparent 55%), #0b1020; }
  .grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(148, 163, 184, 0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.09) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(900px 540px at 50% 45%, #000 0%, transparent 100%); }
  .inner { position: relative; box-sizing: border-box; width: 1200px; height: 630px; padding: 52px 56px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 18px; margin-top: 26px; }
  .logo { width: 62px; height: 62px; border-radius: 16px; background: linear-gradient(135deg, #8b5cf6, #f43f5e); display: flex; align-items: center; justify-content: center; box-shadow: 0 16px 36px rgba(139, 92, 246, 0.45); }
  .logo .doc { width: 26px; height: 30px; background: #fff; border-radius: 5px; position: relative; }
  .logo .doc::before { content: ""; position: absolute; left: 8px; top: 6px; width: 10px; height: 2.4px; border-radius: 2px; background: #8b5cf6; }
  .logo .doc::after { content: ""; position: absolute; left: 8px; top: 12px; width: 6px; height: 2.4px; border-radius: 2px; background: #f43f5e; }
  .wordmark { font-size: 23px; font-weight: 700; letter-spacing: 0.01em; color: #f1f5f9; }
  .tagline { font-size: 14px; color: #94a3b8; margin-top: 5px; }
  .head { margin-top: auto; margin-bottom: 34px; }
  .headline { font-size: 96px; line-height: 1.02; font-weight: 800; letter-spacing: -0.02em; }
  .headline .soft { color: #a78bfa; }
  .headline .grad { background: linear-gradient(90deg, #a78bfa, #fb7185); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .sub { margin-top: 20px; font-size: 24px; line-height: 1.35; color: #cbd5e1; max-width: 560px; }
  .chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 26px; }
  .chip { padding: 8px 16px; border-radius: 999px; background: rgba(148, 163, 184, 0.12); border: 1px solid rgba(148, 163, 184, 0.25); color: #e2e8f0; font-size: 17px; }
  .foot { margin-top: 30px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
  .foot .url { font-size: 21px; font-weight: 600; color: #e2e8f0; }
  .foot .dot { width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #f43f5e); }
</style>
</head>
<body>
  <div class="bg"></div>
  <div class="grid"></div>
  <div class="inner">
    <div class="brand">
      <div class="logo"><div class="doc"></div></div>
      <div>
        <div class="wordmark">Offline Promotion Manager</div>
        <div class="tagline">Free design studio for posters, flyers, cards and more</div>
      </div>
    </div>
    <div class="head">
      <h1 class="headline"><span class="soft">Design anything.</span> <span class="grad">Print any size.</span></h1>
      <p class="sub">Free, private design studio for posters, flyers, cards, certificates and social posts.</p>
      <div class="chips">
        <span class="chip">Posters</span>
        <span class="chip">Flyers</span>
        <span class="chip">Cards</span>
        <span class="chip">Certificates</span>
        <span class="chip">Social posts</span>
        <span class="chip">Signage</span>
      </div>
    </div>
    <div class="foot">
      <span class="url">opm.sritejam.com</span>
      <span class="dot"></span>
      <span style="font-size: 17px; color: #94a3b8;">Design anything. Print any size.</span>
    </div>
  </div>
</body>
</html>`;

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html);
  await page.locator('body').evaluate((node) => node.scrollWidth);
  await page.screenshot({ path: 'public/og-image.png' });
} finally {
  await browser.close();
}
console.log('public/og-image.png');
