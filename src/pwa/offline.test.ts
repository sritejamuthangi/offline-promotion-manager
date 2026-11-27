import { describe, expect, it } from 'vitest';
import { FONTS_MANIFEST } from './constants';
import { planOffline } from './plan';
import { isAppRoute, offlineDocument, scopedPath } from './routes';

describe('offline routing', () => {
  it('starts every screen from a saved page, but not files', () => {
    expect(offlineDocument('')).toBe('index.html');
    expect(offlineDocument('templates')).toBe('editor.html');
    expect(offlineDocument('templates/category/food')).toBe('editor.html');
    expect(offlineDocument('design/0190a4c6-1111-7000-8000-000000000000')).toBe('editor.html');
    expect(offlineDocument('settings/')).toBe('editor.html');
    expect(offlineDocument('sitemap.xml')).toBeUndefined();
    expect(offlineDocument('THIRD-PARTY-NOTICES.txt')).toBeUndefined();
    expect(isAppRoute('assets/index-abc.js')).toBe(false);
  });

  it('finds paths inside the scope, also in a sub-folder', () => {
    const root = new URL('https://opm.example/');
    const studio = new URL('https://example.org/studio/');
    expect(scopedPath(new URL('https://opm.example/assets/a.js'), root)).toBe('assets/a.js');
    expect(scopedPath(new URL('https://opm.example/'), root)).toBe('');
    expect(scopedPath(new URL('https://example.org/studio/templates'), studio)).toBe('templates');
    expect(scopedPath(new URL('https://example.org/other/'), studio)).toBeUndefined();
    expect(scopedPath(new URL('https://api.openverse.org/v1/images'), root)).toBeUndefined();
    expect(scopedPath(new URL('https://opm.example/a%20b.png'), root)).toBe('a b.png');
  });
});

describe('offline plan', () => {
  const files = [
    'index.html',
    'editor.html',
    '404.html',
    'templates/index.html',
    'favicon.svg',
    'manifest.webmanifest',
    'icons/icon-192.png',
    'assets/index-a1.js',
    'assets/index-a1.js.map',
    'assets/index-b2.css',
    'assets/scriptFonts-c3.css',
    'assets/inter-latin-wght-normal-d4.woff2',
    'assets/bebas-neue-latin-400-normal-e5.woff2',
    'assets/bebas-neue-latin-400-normal-e5.woff',
    'assets/noto-sans-jp-12-wght-normal-f6.woff2',
    'assets/noto-sans-telugu-telugu-wght-normal-g7.woff2',
    'sitemap.xml',
    'THIRD-PARTY-NOTICES.txt',
    FONTS_MANIFEST,
  ];

  it('saves the app, its design fonts and start pages when installed', () => {
    expect(planOffline(files).precache).toEqual(
      [
        'assets/bebas-neue-latin-400-normal-e5.woff2',
        'assets/index-a1.js',
        'assets/index-b2.css',
        'assets/inter-latin-wght-normal-d4.woff2',
        'assets/scriptFonts-c3.css',
        'editor.html',
        'favicon.svg',
        'icons/icon-192.png',
        'index.html',
        'manifest.webmanifest',
        FONTS_MANIFEST,
      ].sort(),
    );
  });

  it('saves writing-system fonts only when used', () => {
    expect(planOffline(files).fonts).toEqual([
      'assets/noto-sans-jp-12-wght-normal-f6.woff2',
      'assets/noto-sans-telugu-telugu-wght-normal-g7.woff2',
    ]);
  });
});
