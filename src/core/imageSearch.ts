/**
 * Optional free image search. Only these pure helpers live here (request URLs and response
 * parsing), so the exact formats are unit-tested; the app makes requests only when online
 * image search is turned on in Settings.
 */
export const IMAGE_PROVIDERS = ['openverse', 'wikimedia'] as const;
export type ImageProvider = (typeof IMAGE_PROVIDERS)[number];

export interface ImageSearchResult {
  provider: ImageProvider;
  id: string;
  title: string;
  creator?: string;
  creatorUrl?: string;
  /** Short licence name, e.g. "CC BY-SA 2.0". */
  license: string;
  licenseUrl?: string;
  /** The page describing the original image. */
  landingUrl: string;
  thumbnailUrl: string;
  /** Image files to try downloading, best first. */
  downloadUrls: string[];
  width?: number;
  height?: number;
}

export interface ImageSearchPage {
  results: ImageSearchResult[];
  /** Cursor for the next page; undefined on the last page. */
  next?: number;
}

export const SEARCH_PAGE_SIZE = 20;

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const num = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;

/** Links people may open (http or https). */
function linkUrl(value: unknown): string | undefined {
  const text = str(value);
  if (!text) return undefined;
  try {
    const url = new URL(text);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Images the app loads itself must be https, or browsers block them on secure pages. */
function imageUrl(value: unknown): string | undefined {
  const url = linkUrl(value);
  return url?.startsWith('https:') ? url : undefined;
}

const unique = (values: (string | undefined)[]): string[] => [
  ...new Set(values.filter((v): v is string => Boolean(v))),
];

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Plain text from the small HTML snippets some sources return (creator names, licences). */
export function stripHtml(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code.startsWith('#')) {
        const hex = /^#x/i.test(code);
        const point = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
        return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '\ufffd';
      }
      return ENTITIES[code.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, ' ')
    .trim();
  return text || undefined;
}

export function openverseLicense(code: string | undefined, version: string | undefined): string {
  if (!code) return 'See source';
  if (code === 'cc0') return 'CC0 1.0';
  if (code === 'pdm') return 'Public Domain Mark 1.0';
  return `CC ${code.toUpperCase()}${version ? ` ${version}` : ''}`;
}

export function openverseSearchUrl(
  query: string,
  page: number,
  options: { commercialOnly?: boolean } = {},
): string {
  const params = new URLSearchParams({
    q: query.trim(),
    page: String(page),
    page_size: String(SEARCH_PAGE_SIZE),
    mature: 'false',
  });
  if (options.commercialOnly) params.set('license_type', 'commercial,modification');
  return `https://api.openverse.org/v1/images/?${params}`;
}

export function parseOpenverse(data: unknown, page: number): ImageSearchPage {
  const body = (data ?? {}) as { results?: unknown; page_count?: unknown };
  const raw = Array.isArray(body.results) ? body.results : [];
  const results = raw.flatMap((item): ImageSearchResult[] => {
    const r = (item ?? {}) as Record<string, unknown>;
    const id = str(r.id);
    const thumbnail = imageUrl(r.thumbnail);
    if (!id || !thumbnail) return [];
    const fullSize = new URL(thumbnail);
    fullSize.searchParams.set('full_size', 'true');
    return [
      {
        provider: 'openverse',
        id,
        title: str(r.title) ?? 'Untitled',
        creator: str(r.creator),
        creatorUrl: linkUrl(r.creator_url),
        license: openverseLicense(str(r.license), str(r.license_version)),
        licenseUrl: linkUrl(r.license_url),
        landingUrl:
          linkUrl(r.foreign_landing_url) ?? `https://openverse.org/image/${encodeURIComponent(id)}`,
        thumbnailUrl: thumbnail,
        // The original first; Openverse's own copy works when the original host refuses.
        downloadUrls: unique([imageUrl(r.url), fullSize.href, thumbnail]),
        width: num(r.width),
        height: num(r.height),
      },
    ];
  });
  const pageCount = num(body.page_count) ?? page;
  return { results, next: results.length && page < pageCount ? page + 1 : undefined };
}

export function wikimediaSearchUrl(query: string, offset: number): string {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    generator: 'search',
    gsrsearch: `${query.trim()} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: String(SEARCH_PAGE_SIZE),
    gsroffset: String(offset),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '330',
    iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|ObjectName',
  });
  return `https://commons.wikimedia.org/w/api.php?${params}`;
}

const WEB_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
/** Larger originals are downloaded as a 1920 px copy: plenty for print, much smaller. */
const LARGE_COPY = 1920;

export function parseWikimedia(data: unknown): ImageSearchPage {
  const body = (data ?? {}) as {
    query?: { pages?: unknown };
    continue?: { gsroffset?: unknown };
  };
  const pages = Array.isArray(body.query?.pages) ? [...body.query.pages] : [];
  pages.sort(
    (a, b) =>
      (num((a as { index?: unknown }).index) ?? 0) - (num((b as { index?: unknown }).index) ?? 0),
  );
  const results = pages.flatMap((item): ImageSearchResult[] => {
    const page = (item ?? {}) as { pageid?: unknown; title?: unknown; imageinfo?: unknown };
    const info = (Array.isArray(page.imageinfo) ? page.imageinfo[0] : undefined) as
      | Record<string, unknown>
      | undefined;
    if (!info) return [];
    const meta = (info.extmetadata ?? {}) as Record<string, { value?: unknown } | undefined>;
    const thumbnail = imageUrl(info.thumburl);
    const landing = linkUrl(info.descriptionurl);
    const id = page.pageid === undefined ? undefined : String(page.pageid);
    if (!thumbnail || !landing || !id) return [];
    const width = num(info.width);
    const mime = str(info.mime) ?? '';
    const responsive = (info.responsiveUrls ?? {}) as Record<string, unknown>;
    const large =
      width && width > LARGE_COPY && /\/330px-/.test(thumbnail)
        ? thumbnail.replace('/330px-', `/${LARGE_COPY}px-`)
        : undefined;
    const original =
      WEB_IMAGE_TYPES.has(mime) && (!width || width <= 2560) ? imageUrl(info.url) : undefined;
    const fileName = str(page.title)
      ?.replace(/^File:/i, '')
      .replace(/\.[a-z0-9]+$/i, '');
    return [
      {
        provider: 'wikimedia',
        id,
        title: stripHtml(meta.ObjectName?.value) ?? fileName ?? 'Untitled',
        creator: stripHtml(meta.Artist?.value),
        license: stripHtml(meta.LicenseShortName?.value) ?? 'See source',
        licenseUrl: linkUrl(meta.LicenseUrl?.value),
        landingUrl: landing,
        thumbnailUrl: thumbnail,
        downloadUrls: unique([original, large, imageUrl(responsive['2']), thumbnail]),
        width,
        height: num(info.height),
      },
    ];
  });
  const next = num(body.continue?.gsroffset);
  return { results, next };
}
