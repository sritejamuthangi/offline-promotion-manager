import { type Inventory, planRestore, type RestoreSummary } from '@/core/backup';
import type { BackupContents, BackupFile } from '@/core/backupFile';
import { hashBlob } from '@/core/hash';
import type { AppDatabase, AssetRecord } from './db';

export interface RestoreOptions {
  /** Name for an item that differs from this device's version, e.g. "Poster (restored)". */
  copyName: (name: string) => string;
  now?: number;
  /** Pictures written so far, and how many the file needs. */
  onProgress?: (done: number, total: number) => void;
}

/** Everything on this device, ready to be written into a backup file. */
export async function collectBackupContents(db: AppDatabase): Promise<BackupContents> {
  const [designs, templates, assets] = await Promise.all([
    db.designs.orderBy('createdAt').toArray(),
    db.templates.orderBy('createdAt').toArray(),
    db.assets.orderBy('createdAt').toArray(),
  ]);
  return {
    designs,
    templates: templates.map(({ id, name, category, createdAt, updatedAt, design }) => ({
      id,
      name,
      ...(category ? { category } : {}),
      createdAt,
      updatedAt,
      design,
    })),
    assets: assets.map(({ id, name, type, width, height, createdAt, source, blob }) => ({
      id,
      name,
      type,
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
      createdAt,
      source,
      blob,
    })),
  };
}

async function readInventory(db: AppDatabase): Promise<Inventory> {
  const [designs, templates, assets] = await Promise.all([
    db.designs.toArray(),
    db.templates.toArray(),
    db.assets.toArray(),
  ]);
  return {
    designs: new Map(
      designs.map((design) => [
        design.id,
        { updatedAt: design.updatedAt, deleted: design.deletedAt !== undefined },
      ]),
    ),
    templates: new Map(templates.map((template) => [template.id, template.updatedAt])),
    assets: new Map(assets.map((asset) => [asset.id, asset.hash])),
  };
}

/** What restoring a file would add, without changing anything. */
export async function previewRestore(
  db: AppDatabase,
  file: BackupFile,
  options: Pick<RestoreOptions, 'copyName' | 'now'>,
): Promise<RestoreSummary> {
  const inventory = await readInventory(db);
  return planRestore(
    { designs: file.designs, templates: file.templates, assets: file.assets },
    inventory,
    { copyName: options.copyName, now: options.now ?? Date.now() },
  ).summary;
}

/**
 * Adds a backup to this device. Nothing is replaced or deleted: new items keep their IDs,
 * identical ones are skipped, and different versions are added as copies. Pictures are
 * written one at a time and matched by content, so a picture is stored once.
 */
export async function restoreBackup(
  db: AppDatabase,
  file: BackupFile,
  options: RestoreOptions,
): Promise<RestoreSummary> {
  const inventory = await readInventory(db);
  const plan = planRestore(
    { designs: file.designs, templates: file.templates, assets: file.assets },
    inventory,
    { copyName: options.copyName, now: options.now ?? Date.now() },
  );

  const total = plan.assets.length;
  let done = 0;
  options.onProgress?.(0, total);
  for (const asset of plan.assets) {
    const blob = await file.readAsset(asset);
    const record: AssetRecord = {
      id: asset.id,
      blob,
      type: asset.type,
      name: asset.name,
      size: blob.size,
      width: asset.width,
      height: asset.height,
      hash: asset.hash,
      createdAt: asset.createdAt,
      source: asset.source,
    };
    // The bytes were checked when the file was opened; this guards a file changed since.
    if ((await hashBlob(blob)) !== asset.hash)
      throw new Error(`“${asset.name}” changed while it was being restored.`);
    await db.assets.put(record);
    options.onProgress?.(++done, total);
  }

  await db.transaction('rw', db.designs, db.templates, async () => {
    if (plan.designs.length) await db.designs.bulkPut(plan.designs);
    if (plan.templates.length) await db.templates.bulkPut(plan.templates);
    for (const id of plan.undelete) {
      const design = await db.designs.get(id);
      if (!design) continue;
      delete design.deletedAt;
      await db.designs.put(design);
    }
  });
  return plan.summary;
}
