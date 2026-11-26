import Dexie, { type EntityTable } from 'dexie';
import type { Design } from '@/core/schema';
import type { TemplateCategory } from '@/core/templates';

/** Where an asset came from, kept so licences and credits travel with the image. */
export interface AssetSource {
  kind: 'upload' | 'builtin' | 'openverse' | 'wikimedia';
  /** Page describing the original (for online images). */
  url?: string;
  /** Licence name, e.g. "CC BY-SA 4.0". */
  license?: string;
  licenseUrl?: string;
  /** A ready-made credit line people can add to their design. */
  attribution?: string;
  title?: string;
  creator?: string;
  creatorUrl?: string;
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

/** A design someone saved as a reusable template on this device. */
export interface SavedTemplate {
  id: string;
  name: string;
  category?: TemplateCategory;
  design: Design;
  createdAt: number;
  updatedAt: number;
}

export type AppDatabase = Dexie & {
  designs: EntityTable<Design, 'id'>;
  assets: EntityTable<AssetRecord, 'id'>;
  templates: EntityTable<SavedTemplate, 'id'>;
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
  // Version 2: templates people save from their own designs.
  db.version(2).stores({
    templates: 'id, updatedAt, createdAt',
  });
  return db;
}
