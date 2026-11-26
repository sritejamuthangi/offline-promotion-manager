import {
  type ImageProvider,
  type ImageSearchPage,
  type ImageSearchResult,
  openverseSearchUrl,
  parseOpenverse,
  parseWikimedia,
  wikimediaSearchUrl,
} from '@/core/imageSearch';
import { type AssetRecord, assetRepository } from '@/storage';

/** The source asked us to slow down (HTTP 429). */
export class SearchRateLimitError extends Error {
  constructor() {
    super('Too many image searches');
    this.name = 'SearchRateLimitError';
  }
}

/** Requests carry no cookies or referrer and never include design data. */
const PRIVATE: RequestInit = { credentials: 'omit', referrerPolicy: 'no-referrer' };

/** Large enough for print-quality photos, small enough to keep device storage in check. */
export const MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024;

function timedSignal(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

export async function searchImages(
  provider: ImageProvider,
  query: string,
  cursor: number | undefined,
  options: { commercialOnly: boolean },
  signal?: AbortSignal,
): Promise<ImageSearchPage> {
  const url =
    provider === 'openverse'
      ? openverseSearchUrl(query, cursor ?? 1, options)
      : wikimediaSearchUrl(query, cursor ?? 0);
  const response = await fetch(url, {
    ...PRIVATE,
    signal: timedSignal(signal, 15_000),
    headers: { Accept: 'application/json' },
  });
  if (response.status === 429) throw new SearchRateLimitError();
  if (!response.ok) throw new Error(`Image search failed with status ${response.status}`);
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || 'error' in data || 'detail' in data)
    throw new Error('Image provider returned an error.');
  if (provider === 'openverse' && !('results' in data && Array.isArray(data.results)))
    throw new Error('Image provider returned an unexpected response.');
  return provider === 'openverse' ? parseOpenverse(data, cursor ?? 1) : parseWikimedia(data);
}

/** Downloads the best available copy of a result, trying each candidate in turn. */
export async function downloadImage(
  result: ImageSearchResult,
  signal?: AbortSignal,
): Promise<Blob> {
  for (const url of result.downloadUrls) {
    try {
      const response = await fetch(url, { ...PRIVATE, signal: timedSignal(signal, 25_000) });
      const type = response.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
      if (
        !response.ok ||
        !type.startsWith('image/') ||
        Number(response.headers.get('content-length') ?? 0) > MAX_DOWNLOAD_BYTES
      ) {
        await response.body?.cancel();
        continue;
      }
      // Enforce the limit while reading, even if a host omits Content-Length.
      const reader = response.body?.getReader();
      if (!reader) continue;
      const chunks: BlobPart[] = [];
      let size = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_DOWNLOAD_BYTES) {
            await reader.cancel();
            throw new Error('Image exceeds the download limit.');
          }
          chunks.push(new Uint8Array(value));
        }
      } finally {
        reader.releaseLock();
      }
      const blob = new Blob(chunks, { type });
      if (blob.size === 0 || blob.size > MAX_DOWNLOAD_BYTES || !blob.type.startsWith('image/'))
        continue;
      return blob;
    } catch (error) {
      if (signal?.aborted) throw error;
      // Some hosts refuse cross-site downloads; try the next copy.
    }
  }
  throw new Error('None of the image copies could be downloaded');
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

/** Downloads a result and stores it on this device with its licence and credit. */
export async function saveSearchResult(
  result: ImageSearchResult,
  credit: string,
  signal?: AbortSignal,
): Promise<AssetRecord> {
  const blob = await downloadImage(result, signal);
  signal?.throwIfAborted();
  const extension = EXTENSIONS[blob.type] ?? 'img';
  return assetRepository.add({
    blob,
    type: blob.type,
    name: `${result.title.slice(0, 120)}.${extension}`,
    source: {
      kind: result.provider,
      url: result.landingUrl,
      license: result.license,
      licenseUrl: result.licenseUrl,
      attribution: credit,
      title: result.title,
      creator: result.creator,
      creatorUrl: result.creatorUrl,
    },
  });
}
