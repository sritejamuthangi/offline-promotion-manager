import { createDexieAssetRepository } from './assetRepository';
import { openDatabase } from './db';
import { createDexieDesignRepository } from './dexieDesignRepository';
import { createDexieTemplateRepository } from './templateRepository';

export type { AssetRepository } from './assetRepository';
export { collectBackupContents, previewRestore, restoreBackup } from './backupRepository';
export { getStorageStatus, requestPersistentStorage, type StorageStatus } from './browserStorage';
export type { AssetRecord, AssetSource, SavedTemplate } from './db';
export { DesignNotFoundError, type DesignRepository } from './repositories';
export { TemplateNotFoundError, type TemplateRepository } from './templateRepository';

/** The app's database, stored in this browser only. */
export const db = openDatabase();

export const designRepository = createDexieDesignRepository(db);

/** Uploaded images live beside designs and are never sent anywhere. */
export const assetRepository = createDexieAssetRepository(db);

/** Templates saved from people's own designs. */
export const templateRepository = createDexieTemplateRepository(db);

/** Designs stay in "Recently deleted" for this long before being removed for good. */
export const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function purgeExpiredDesigns(now: number = Date.now()): Promise<number> {
  return designRepository.purgeDeleted(now - TRASH_RETENTION_MS);
}
