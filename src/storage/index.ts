import { openDatabase } from './db';
import { createDexieDesignRepository } from './dexieDesignRepository';

export { getStorageStatus, requestPersistentStorage, type StorageStatus } from './browserStorage';
export type { AssetRecord, AssetSource } from './db';
export { DesignNotFoundError, type DesignRepository } from './repositories';

/** The app's database, stored in this browser only. */
export const db = openDatabase();

export const designRepository = createDexieDesignRepository(db);

/** Designs stay in "Recently deleted" for this long before being removed for good. */
export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function purgeExpiredDesigns(now: number = Date.now()): Promise<number> {
  return designRepository.purgeDeleted(now - TRASH_RETENTION_MS);
}
