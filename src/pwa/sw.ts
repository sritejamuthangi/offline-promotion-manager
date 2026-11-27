/// <reference lib="webworker" />
/**
 * The service worker: keeps the app on the device so it starts and works offline.
 * Built by scripts/prerender.mjs, which fills in the files of the build.
 *
 * - App files (scripts, styles, design fonts, icons and two start pages) are saved when the
 *   worker installs, all at once, so a version is either fully saved or not used.
 * - Screens load from the network when online, so public pages stay fresh, and from the
 *   saved start pages offline or when the network is too slow.
 * - Writing-system fonts are saved the first time a design uses them (or all at once from
 *   Settings), so they keep working offline.
 * - A new version waits until the app asks it to take over, so an open design is never
 *   switched to new code mid-edit.
 */
import { APP_CACHE_PREFIX, FONT_CACHE, type WorkerMessage } from './constants';
import { offlineDocument, scopedPath } from './routes';

declare const __PRECACHE__: readonly string[];
declare const __FONTS__: readonly string[];
declare const __VERSION__: string;

const sw = self as unknown as ServiceWorkerGlobalScope;
const APP_CACHE = `${APP_CACHE_PREFIX}${__VERSION__}`;
const PRECACHED = new Set(__PRECACHE__);
const FONT_FILES = new Set(__FONTS__);
/** How long a screen may take to load online before the saved copy is shown instead. */
const NAVIGATION_TIMEOUT_MS = 4000;

const scope = () => new URL(sw.registration.scope);

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) =>
      cache.addAll(
        // Revalidate with the server, so a stale HTTP cache never mixes two versions.
        __PRECACHE__.map((path) => new Request(new URL(path, scope()), { cache: 'no-cache' })),
      ),
    ),
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith(APP_CACHE_PREFIX) && name !== APP_CACHE) await caches.delete(name);
      // Remove writing-system fonts this version no longer uses.
      const fonts = await caches.open(FONT_CACHE);
      for (const request of await fonts.keys()) {
        const path = scopedPath(new URL(request.url), scope());
        if (path === undefined || !FONT_FILES.has(path)) await fonts.delete(request);
      }
      await sw.clients.claim();
    })(),
  );
});

sw.addEventListener('message', (event) => {
  const message = event.data as WorkerMessage | undefined;
  if (message?.type === 'SKIP_WAITING') void sw.skipWaiting();
});

sw.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const path = scopedPath(new URL(request.url), scope());
  // Other sites (such as online image search) and other paths use the network as usual.
  if (path === undefined) return;
  if (request.mode === 'navigate') {
    const document = offlineDocument(path);
    if (document) event.respondWith(screen(request, document));
  } else if (PRECACHED.has(path)) {
    event.respondWith(appFile(request));
  } else if (FONT_FILES.has(path)) {
    event.respondWith(font(request));
  }
});

const timeout = (ms: number) =>
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timed out')), ms));

/**
 * Saved files never change (their names contain a content hash), so a `Vary` header, such
 * as `Vary: Origin` on module scripts and fonts, must not stop them from matching.
 */
const MATCH: CacheQueryOptions = { ignoreVary: true };

async function screen(request: Request, document: string): Promise<Response> {
  const network = fetch(request);
  try {
    return await Promise.race([network, timeout(NAVIGATION_TIMEOUT_MS)]);
  } catch {
    const saved = await caches.match(new URL(document, scope()).href, MATCH);
    // Nothing saved yet: keep waiting for the network.
    return saved ?? network;
  }
}

async function appFile(request: Request): Promise<Response> {
  return (await caches.match(request, MATCH)) ?? fetch(request);
}

async function font(request: Request): Promise<Response> {
  const cache = await caches.open(FONT_CACHE);
  const saved = await cache.match(request, MATCH);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}
