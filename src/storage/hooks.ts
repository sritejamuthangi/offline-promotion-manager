import { useLiveQuery } from 'dexie-react-hooks';
import type { Design } from '@/core/schema';
import type { AssetRecord, SavedTemplate } from './db';
import { assetRepository, designRepository, templateRepository } from './index';

/** Live list of designs; `undefined` while loading. Updates automatically on any change. */
export function useDesigns(): Design[] | undefined {
  return useLiveQuery(() => designRepository.list(), []);
}

/** Live list of designs in "Recently deleted"; `undefined` while loading. */
export function useDeletedDesigns(): Design[] | undefined {
  return useLiveQuery(() => designRepository.listDeleted(), []);
}

/** Live design by ID: `undefined` while loading, `null` when it does not exist. */
export function useDesign(id: string): Design | null | undefined {
  return useLiveQuery(async () => (await designRepository.get(id)) ?? null, [id]);
}

/** Live list of templates saved on this device; `undefined` while loading. */
export function useSavedTemplates(): SavedTemplate[] | undefined {
  return useLiveQuery(() => templateRepository.list(), []);
}

/** Live list of images stored on this device, newest first; `undefined` while loading. */
export function useImageAssets(): AssetRecord[] | undefined {
  return useLiveQuery(
    async () => (await assetRepository.list()).filter((asset) => asset.type.startsWith('image/')),
    [],
  );
}

/** Live asset record by ID (for credits and licences); `null` when it does not exist. */
export function useAsset(id: string | undefined): AssetRecord | null | undefined {
  return useLiveQuery(async () => (id ? ((await assetRepository.get(id)) ?? null) : null), [id]);
}
