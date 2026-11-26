import { createDexieAssetRepository } from './assetRepository';
import { openDatabase } from './db';
import { createDexieDesignRepository } from './dexieDesignRepository';

export type { AssetRepository } from './assetRepository';
export { getStorageStatus, requestPersistentStorage, type StorageStatus } from './browserStorage';
export type { AssetRecord, AssetSource } from './db';
export { DesignNotFoundError, type DesignRepository } from './repositories';

/** The app's database, stored in this browser only. */
export const db = openDatabase();

export const designRepository = createDexieDesignRepository(db);

/** Uploaded images live beside designs and are never sent anywhere. */
export const assetRepository = createDexieAssetRepository(db);

/** Designs stay in "Recently deleted" for this long before being removed for good. */
export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function purgeExpiredDesigns(now: number = Date.now()): Promise<number> {
  return designRepository.purgeDeleted(now - TRASH_RETENTION_MS);
}
