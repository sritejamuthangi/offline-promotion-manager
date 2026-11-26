import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ImageSearchResult } from '@/core/imageSearch';
import { downloadImage, MAX_DOWNLOAD_BYTES, SearchRateLimitError, searchImages } from './search';

const result: ImageSearchResult = {
  provider: 'openverse',
  id: 'one',
  title: 'Photo',
  license: 'CC0',
  landingUrl: 'https://example.org/photo',
  thumbnailUrl: 'https://example.org/thumb',
  downloadUrls: ['https://example.org/original', 'https://example.org/copy'],
};

afterEach(() => vi.unstubAllGlobals());

describe('image requests', () => {
  it('reports rate limits and API errors rather than empty search results', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(Response.json({ error: { code: 'badquery' } }));
    vi.stubGlobal('fetch', fetcher);
    await expect(
      searchImages('openverse', 'flower', undefined, { commercialOnly: true }),
    ).rejects.toBeInstanceOf(SearchRateLimitError);
    await expect(
      searchImages('wikimedia', 'flower', undefined, { commercialOnly: true }),
    ).rejects.toThrow('provider returned an error');
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
  });

  it('falls back after a host rejects CORS and keeps the returned image type', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2]), { headers: { 'content-type': 'image/png' } }),
      );
    vi.stubGlobal('fetch', fetcher);
    const blob = await downloadImage(result);
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe(2);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual(result.downloadUrls);
  });

  it('cancels oversized streams even without a content length and tries the next copy', async () => {
    const cancelled = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_DOWNLOAD_BYTES + 1));
      },
      cancel: cancelled,
    });
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(stream, { headers: { 'content-type': 'image/jpeg' } }))
      .mockResolvedValueOnce(new Response('small', { headers: { 'content-type': 'image/png' } }));
    vi.stubGlobal('fetch', fetcher);
    expect((await downloadImage(result)).size).toBe(5);
    expect(cancelled).toHaveBeenCalledOnce();
  });

  it('rejects non-image responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation(
          async () =>
            new Response('<html>error</html>', { headers: { 'content-type': 'text/html' } }),
        ),
    );
    await expect(downloadImage(result)).rejects.toThrow('None of the image copies');
  });

  it('stops the fallback chain when the person cancels', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn().mockImplementation(async () => {
      controller.abort();
      throw new DOMException('Aborted', 'AbortError');
    });
    vi.stubGlobal('fetch', fetcher);
    await expect(downloadImage(result, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
