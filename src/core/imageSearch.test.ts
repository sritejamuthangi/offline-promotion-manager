import { describe, expect, it } from 'vitest';
import {
  openverseLicense,
  openverseSearchUrl,
  parseOpenverse,
  parseWikimedia,
  stripHtml,
  wikimediaSearchUrl,
} from './imageSearch';

// Trimmed copies of real responses (November 2026).
const OPENVERSE = {
  result_count: 240,
  page_count: 12,
  page_size: 20,
  page: 1,
  results: [
    {
      id: 'c750ca5e-e5cb-470d-807f-83d4396fdabb',
      title: 'Sunflower',
      creator: 'tony_donnelly',
      creator_url: 'https://www.flickr.com/photos/15203873@N08',
      license: 'by-sa',
      license_version: '2.0',
      license_url: 'https://creativecommons.org/licenses/by-sa/2.0/',
      url: 'https://live.staticflickr.com/6070/6101744035_2566341f3c_b.jpg',
      thumbnail: 'https://api.openverse.org/v1/images/c750ca5e-e5cb-470d-807f-83d4396fdabb/thumb/',
      foreign_landing_url: 'https://www.flickr.com/photos/15203873@N08/6101744035',
      width: 1024,
      height: 768,
    },
    { id: 'no-thumbnail', title: 'Broken' },
    {
      id: 'insecure',
      title: '',
      license: 'cc0',
      url: 'http://example.org/a.jpg',
      thumbnail: 'https://api.openverse.org/v1/images/insecure/thumb/',
    },
  ],
};

const WIKIMEDIA = {
  continue: { gsroffset: 20, continue: 'gsroffset||' },
  query: {
    pages: [
      {
        pageid: 7613324,
        title: 'File:Sunflower sky backdrop.jpg',
        index: 2,
        imageinfo: [
          {
            width: 1404,
            height: 1555,
            thumburl:
              'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Sunflower_sky_backdrop.jpg/330px-Sunflower_sky_backdrop.jpg',
            url: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Sunflower_sky_backdrop.jpg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Sunflower_sky_backdrop.jpg',
            mime: 'image/jpeg',
            extmetadata: {
              LicenseShortName: { value: 'CC BY-SA 3.0' },
              Artist: { value: '<a href="https://example.org">Fir0002</a> &amp; friends' },
            },
          },
        ],
      },
      {
        pageid: 5775722,
        title: 'File:Sunflower macro wide.tif',
        index: 1,
        imageinfo: [
          {
            width: 6000,
            height: 4000,
            thumburl:
              'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Sunflower_macro_wide.tif/330px-Sunflower_macro_wide.tif.jpg?utm_source=commons.wikimedia.org',
            url: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Sunflower_macro_wide.tif',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Sunflower_macro_wide.tif',
            mime: 'image/tiff',
            responsiveUrls: {
              2: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Sunflower_macro_wide.tif/960px-Sunflower_macro_wide.tif.jpg',
            },
            extmetadata: {
              ObjectName: { value: 'Sunflower macro wide' },
              LicenseShortName: { value: 'GFDL 1.2' },
              LicenseUrl: { value: 'http://www.gnu.org/licenses/old-licenses/fdl-1.2.html' },
            },
          },
        ],
      },
    ],
  },
};

describe('Openverse', () => {
  it('builds a search URL with the commercial-use filter', () => {
    const url = new URL(openverseSearchUrl('  red flowers ', 2, { commercialOnly: true }));
    expect(url.origin + url.pathname).toBe('https://api.openverse.org/v1/images/');
    expect(url.searchParams.get('q')).toBe('red flowers');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('page_size')).toBe('20');
    expect(url.searchParams.get('mature')).toBe('false');
    expect(url.searchParams.get('license_type')).toBe('commercial,modification');
    expect(new URL(openverseSearchUrl('a', 1)).searchParams.has('license_type')).toBe(false);
  });

  it('parses results with credits and download fallbacks', () => {
    const page = parseOpenverse(OPENVERSE, 1);
    expect(page.next).toBe(2);
    expect(page.results).toHaveLength(2);
    const [first, second] = page.results;
    expect(first).toMatchObject({
      provider: 'openverse',
      title: 'Sunflower',
      creator: 'tony_donnelly',
      license: 'CC BY-SA 2.0',
      landingUrl: 'https://www.flickr.com/photos/15203873@N08/6101744035',
      width: 1024,
    });
    expect(first?.downloadUrls).toEqual([
      'https://live.staticflickr.com/6070/6101744035_2566341f3c_b.jpg',
      'https://api.openverse.org/v1/images/c750ca5e-e5cb-470d-807f-83d4396fdabb/thumb/?full_size=true',
      'https://api.openverse.org/v1/images/c750ca5e-e5cb-470d-807f-83d4396fdabb/thumb/',
    ]);
    // Insecure originals are skipped; the https copy from Openverse is used instead.
    expect(second?.title).toBe('Untitled');
    expect(second?.license).toBe('CC0 1.0');
    expect(second?.downloadUrls[0]).toContain('api.openverse.org');
    expect(second?.landingUrl).toBe('https://openverse.org/image/insecure');
  });

  it('stops after the last page and survives unexpected data', () => {
    expect(parseOpenverse({ ...OPENVERSE, page_count: 1 }, 1).next).toBeUndefined();
    expect(parseOpenverse(null, 1)).toEqual({ results: [], next: undefined });
    expect(parseOpenverse({ results: 'nope' }, 1).results).toEqual([]);
  });

  it('names licences', () => {
    expect(openverseLicense('by', '4.0')).toBe('CC BY 4.0');
    expect(openverseLicense('pdm', undefined)).toBe('Public Domain Mark 1.0');
    expect(openverseLicense(undefined, undefined)).toBe('See source');
  });
});

describe('Wikimedia Commons', () => {
  it('builds an anonymous, CORS-friendly search URL for photos', () => {
    const url = new URL(wikimediaSearchUrl('sunflower', 40));
    expect(url.origin).toBe('https://commons.wikimedia.org');
    expect(url.searchParams.get('origin')).toBe('*');
    expect(url.searchParams.get('gsrsearch')).toBe('sunflower filetype:bitmap');
    expect(url.searchParams.get('gsroffset')).toBe('40');
    expect(url.searchParams.get('gsrnamespace')).toBe('6');
  });

  it('parses results in search order with plain-text credits', () => {
    const page = parseWikimedia(WIKIMEDIA);
    expect(page.next).toBe(20);
    expect(page.results.map((r) => r.id)).toEqual(['5775722', '7613324']);
    const [tiff, jpeg] = page.results;
    expect(tiff?.title).toBe('Sunflower macro wide');
    expect(tiff?.license).toBe('GFDL 1.2');
    expect(tiff?.licenseUrl).toBe('http://www.gnu.org/licenses/old-licenses/fdl-1.2.html');
    // TIFF originals can't be shown in browsers: use a 1920 px JPEG copy instead.
    expect(tiff?.downloadUrls[0]).toContain('/1920px-Sunflower_macro_wide.tif.jpg');
    expect(tiff?.downloadUrls).toContain(
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Sunflower_macro_wide.tif/960px-Sunflower_macro_wide.tif.jpg',
    );
    expect(jpeg?.title).toBe('Sunflower sky backdrop');
    expect(jpeg?.creator).toBe('Fir0002 & friends');
    expect(jpeg?.downloadUrls[0]).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/4/40/Sunflower_sky_backdrop.jpg',
    );
  });

  it('ends without a continue marker and survives unexpected data', () => {
    expect(parseWikimedia({ query: WIKIMEDIA.query }).next).toBeUndefined();
    expect(parseWikimedia(undefined).results).toEqual([]);
  });
});

describe('stripHtml', () => {
  it('keeps only text and decodes entities', () => {
    expect(stripHtml('<b><a href="x">Jane&nbsp;Doe</a></b>')).toBe('Jane Doe');
    expect(stripHtml('Caf&#233; &#x26; bar')).toBe('Café & bar');
    expect(stripHtml('<script>alert(1)</script>')).toBe('alert(1)');
    expect(stripHtml('   ')).toBeUndefined();
    expect(stripHtml(42)).toBeUndefined();
    expect(stripHtml('&#99999999999;')).toBe('\ufffd');
  });
});
