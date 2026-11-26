import { newId } from '@/core/ids';
import type { AppDatabase, AssetRecord, AssetSource } from './db';

export interface NewAsset {
  blob: Blob;
  name: string;
  type?: string;
  width?: number;
  height?: number;
  source?: AssetSource;
}

/** Images and other files stored beside designs in the local database. */
export interface AssetRepository {
  /** Stores the file once; uploading identical bytes again returns the existing asset. */
  add(input: NewAsset): Promise<AssetRecord>;
  get(id: string): Promise<AssetRecord | undefined>;
  list(): Promise<AssetRecord[]>;
  remove(id: string): Promise<void>;
}

export type AssetHasher = (blob: Blob) => Promise<string>;
export type DimensionReader = (
  blob: Blob,
) => Promise<{ width: number; height: number } | undefined>;

/** SHA-256 keeps deduplication stable; a fast fallback keeps local HTTP use working. */
export async function hashBlob(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    );
  }
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16)}-${bytes.length}`;
}

export async function readImageDimensions(
  blob: Blob,
): Promise<{ width: number; height: number } | undefined> {
  if (typeof createImageBitmap !== 'function') return undefined;
  try {
    const bitmap = await createImageBitmap(blob);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return undefined;
  }
}

export function createDexieAssetRepository(
  db: AppDatabase,
  clock: () => number = Date.now,
  hash: AssetHasher = hashBlob,
  readDimensions: DimensionReader = readImageDimensions,
): AssetRepository {
  return {
    async add(input) {
      if (!input.blob.size) throw new RangeError('An asset cannot be empty.');
      const digest = await hash(input.blob);
      // Browser decoding is not a Dexie operation, so read dimensions before the
      // transaction; awaiting it inside would make Dexie commit too early.
      const size =
        input.width && input.height
          ? { width: input.width, height: input.height }
          : await readDimensions(input.blob);
      return db.transaction('rw', db.assets, async () => {
        const existing = await db.assets.where('hash').equals(digest).first();
        if (existing) {
          // Identical uploaded bytes may later be discovered online. Preserve their
          // known licence rather than silently dropping the newly available credit.
          if (existing.source.kind === 'upload' && input.source && input.source.kind !== 'upload') {
            const enriched = { ...existing, source: input.source };
            await db.assets.put(enriched);
            return enriched;
          }
          return existing;
        }
        const record: AssetRecord = {
          id: newId(),
          blob: input.blob,
          type: input.type || input.blob.type || 'application/octet-stream',
          name: input.name,
          size: input.blob.size,
          width: size?.width,
          height: size?.height,
          hash: digest,
          createdAt: clock(),
          source: input.source ?? { kind: 'upload' },
        };
        await db.assets.add(record);
        return record;
      });
    },
    get: (id) => db.assets.get(id),
    list: () => db.assets.orderBy('createdAt').reverse().toArray(),
    remove: async (id) => {
      await db.assets.delete(id);
    },
  };
}
