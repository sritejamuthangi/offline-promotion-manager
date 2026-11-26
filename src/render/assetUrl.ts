import { useEffect, useSyncExternalStore } from 'react';
import { assetRepository } from '@/storage';

const urls = new Map<string, string>();
const loading = new Set<string>();
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

function load(id: string) {
  if (urls.has(id) || loading.has(id) || failed.has(id)) return;
  loading.add(id);
  assetRepository
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
    if (id) load(id);
  }, [id]);
  return id ? urls.get(id) : src;
}
