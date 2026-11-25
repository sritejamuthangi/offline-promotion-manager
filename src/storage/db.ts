import Dexie, { type EntityTable } from 'dexie';
import type { Design } from '@/core/schema';

/** Where an asset came from, kept so licences and credits travel with the image. */
export interface AssetSource {
  kind: 'upload' | 'builtin' | 'openverse' | 'wikimedia';
  url?: string;
  license?: string;
  attribution?: string;
}

/** An image or font stored on this device. */
export interface AssetRecord {
  id: string;
  blob: Blob;
  type: string;
  name: string;
  size: number;
  width?: number;
  height?: number;
  /** SHA-256 of the file, used to avoid storing the same image twice. */
  hash: string;
  createdAt: number;
  source: AssetSource;
}

export type AppDatabase = Dexie & {
  designs: EntityTable<Design, 'id'>;
  assets: EntityTable<AssetRecord, 'id'>;
};

export const DB_NAME = 'offline-promotion-manager';

/**
 * Opens the IndexedDB database. Each `version()` block is permanent: to change the
 * structure, add a new version with an upgrade function instead of editing old ones.
 */
export function openDatabase(name: string = DB_NAME): AppDatabase {
  const db = new Dexie(name) as AppDatabase;
  db.version(1).stores({
    designs: 'id, updatedAt, createdAt',
    assets: 'id, hash, createdAt',
  });
  return db;
}
