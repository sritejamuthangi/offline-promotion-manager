import { useLiveQuery } from 'dexie-react-hooks';
import type { Design } from '@/core/schema';
import { designRepository } from './index';

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
