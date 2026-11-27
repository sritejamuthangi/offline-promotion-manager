import { FONT_CACHE, FONTS_MANIFEST, type FontsManifest } from './constants';

const base = () => new URL(import.meta.env.BASE_URL, window.location.origin);

/** The writing-system font files of this version, or undefined outside the built app. */
export async function loadFontsManifest(): Promise<FontsManifest | undefined> {
  try {
    const response = await fetch(new URL(FONTS_MANIFEST, base()));
    if (!response.ok) return undefined;
    const manifest = (await response.json()) as Partial<FontsManifest>;
    return Array.isArray(manifest.files) && typeof manifest.bytes === 'number'
      ? (manifest as FontsManifest)
      : undefined;
  } catch {
    return undefined;
  }
}

async function missingFiles(manifest: FontsManifest, cache: Cache): Promise<URL[]> {
  const saved = new Set((await cache.keys()).map((request) => new URL(request.url).pathname));
  return manifest.files
    .map((file) => new URL(file, base()))
    .filter((url) => !saved.has(url.pathname));
}

/** How many of the writing-system font files are saved for offline use. */
export async function savedFontCount(manifest: FontsManifest): Promise<number> {
  if (!('caches' in window)) return 0;
  const cache = await caches.open(FONT_CACHE);
  return manifest.files.length - (await missingFiles(manifest, cache)).length;
}

/**
 * Saves every writing-system font file for offline use, a few at a time. Reports how many
 * files are saved. Files saved before stay saved if this fails or is cancelled.
 */
export async function saveAllFonts(
  manifest: FontsManifest,
  onProgress: (saved: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const cache = await caches.open(FONT_CACHE);
  const missing = await missingFiles(manifest, cache);
  let saved = manifest.files.length - missing.length;
  onProgress(saved);
  const next = async (): Promise<void> => {
    for (let url = missing.shift(); url; url = missing.shift()) {
      signal?.throwIfAborted();
      const response = await fetch(url, { signal });
      if (!response.ok)
        throw new Error(`A font file could not be downloaded (${response.status}).`);
      await cache.put(url, response);
      onProgress(++saved);
    }
  };
  await Promise.all(Array.from({ length: 6 }, next));
}
