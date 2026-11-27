import { useEffect, useSyncExternalStore } from 'react';
import { assetRepository } from '@/storage';

const urls = new Map<string, string>();
const loading = new Map<string, Promise<void>>();
const failed = new Set<string>();
const listeners = new Set<() => void>();
let revision = 0;

/** `asset:<id>` references are resolved to a temporary in-memory object URL. */
export function assetIdFromSrc(src: string | undefined): string | undefined {
  return src?.startsWith('asset:') ? src.slice('asset:'.length) : undefined;
}

function emit() {
  revision++;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function load(id: string): Promise<void> {
  if (urls.has(id) || failed.has(id)) return Promise.resolve();
  const pending = loading.get(id);
  if (pending) return pending;
  const promise = assetRepository
    .get(id)
    .then((record) => {
      if (!record) {
        failed.add(id);
        return;
      }
      urls.set(id, URL.createObjectURL(record.blob));
    })
    .catch(() => {
      failed.add(id);
    })
    .finally(() => {
      loading.delete(id);
      emit();
    });
  loading.set(id, promise);
  return promise;
}

/** Loads uploaded images into memory, e.g. so every picture is ready before printing. */
export async function preloadAssets(sources: Iterable<string>): Promise<void> {
  const ids = new Set<string>();
  for (const src of sources) {
    const id = assetIdFromSrc(src);
    if (id) ids.add(id);
  }
  await Promise.all(
    [...ids].map(async (id) => {
      failed.delete(id); // An explicit retry may recover a temporary IndexedDB failure.
      await load(id);
      if (!urls.has(id)) throw new Error('An uploaded image could not be loaded.');
    }),
  );
}

/** Resolves bundled paths unchanged and loads uploaded assets from IndexedDB. */
export function useAssetUrl(src: string | undefined): string | undefined {
  useSyncExternalStore(
    subscribe,
    () => revision,
    () => 0,
  );
  const id = assetIdFromSrc(src);
  useEffect(() => {
    if (id) void load(id);
  }, [id]);
  return id ? urls.get(id) : src;
}
