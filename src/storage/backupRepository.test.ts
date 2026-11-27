import { afterEach, describe, expect, it } from 'vitest';
import { createBackupZip, readBackupZip } from '@/core/backupFile';
import { createDesign } from '@/core/design/factory';
import { newId } from '@/core/ids';
import type { Design } from '@/core/schema';
import { createDexieAssetRepository } from './assetRepository';
import { collectBackupContents, previewRestore, restoreBackup } from './backupRepository';
import { openDatabase } from './db';
import { createDexieDesignRepository } from './dexieDesignRepository';
import { createDexieTemplateRepository } from './templateRepository';

const databases: ReturnType<typeof openDatabase>[] = [];

function database() {
  const db = openDatabase(`backup-test-${newId()}`);
  databases.push(db);
  return db;
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map((db) => db.delete()));
});

const design = (name: string, now: number): Design =>
  createDesign({ name, width: 400, height: 300, unit: 'px', now });

async function library() {
  const db = database();
  const designs = createDexieDesignRepository(db);
  const assets = createDexieAssetRepository(db);
  const templates = createDexieTemplateRepository(db);
  const asset = await assets.add({
    blob: new Blob(['picture bytes'], { type: 'image/png' }),
    name: 'photo.png',
  });
  const poster = design('Poster', 1000);
  poster.pages[0]?.elements.push({
    id: 'i1',
    type: 'image',
    x: 10,
    y: 10,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    src: `asset:${asset.id}`,
    fit: 'cover',
  });
  await designs.save(poster);
  await templates.create({ name: 'Poster template', category: 'business', design: poster });
  return { db, designs, assets, templates, poster, asset };
}

const copyName = (name: string) => `${name} (restored)`;

describe('backup repository', () => {
  it('writes everything on the device into a backup file', async () => {
    const source = await library();
    const contents = await collectBackupContents(source.db);
    expect(contents.designs).toHaveLength(1);
    expect(contents.templates).toHaveLength(1);
    expect(contents.assets).toHaveLength(1);
    expect(contents.designs[0]?.name).toBe('Poster');
    expect(contents.assets[0]?.blob.size).toBe(13);
  });

  it('restores a backup into an empty browser, then recognizes it as existing', async () => {
    const source = await library();
    const zip = await createBackupZip(await collectBackupContents(source.db), {
      kind: 'backup',
      now: 5000,
    });
    const target = database();
    const file = await readBackupZip(zip);
    const preview = await previewRestore(target, file, { copyName });
    expect(preview).toEqual({ designs: 1, templates: 1, images: 1, existing: 0, copies: 0 });
    expect(await target.designs.count()).toBe(0);

    const steps: Array<[number, number]> = [];
    const summary = await restoreBackup(target, file, {
      copyName,
      onProgress: (done, total) => steps.push([done, total]),
    });
    expect(summary).toEqual({ designs: 1, templates: 1, images: 1, existing: 0, copies: 0 });
    expect(steps).toEqual([
      [0, 1],
      [1, 1],
    ]);

    const restored = await target.designs.toArray();
    expect(restored).toHaveLength(1);
    expect(restored[0]?.name).toBe('Poster');
    expect(restored[0]?.pages[0]?.elements[0]).toMatchObject({ src: `asset:${source.asset.id}` });
    expect(await target.assets.count()).toBe(1);
    expect(await (await target.assets.get(source.asset.id))?.blob.text()).toBe('picture bytes');
    expect(await target.templates.count()).toBe(1);

    // Restoring the same file again changes nothing.
    const again = await readBackupZip(zip);
    const second = await restoreBackup(target, again, { copyName });
    expect(second).toEqual({ designs: 0, templates: 0, images: 0, existing: 3, copies: 0 });
    expect(await target.designs.count()).toBe(1);
    expect(await target.templates.count()).toBe(1);
  });

  it('adds a changed design as a copy and keeps the local one', async () => {
    const source = await library();
    const zip = await createBackupZip(await collectBackupContents(source.db), { kind: 'backup' });
    const target = database();
    const local = { ...source.poster, updatedAt: 1, name: 'My local poster' };
    await target.designs.put(local);

    const file = await readBackupZip(zip);
    const summary = await restoreBackup(target, file, { copyName });
    expect(summary).toEqual({ designs: 0, templates: 1, images: 1, existing: 0, copies: 1 });
    const all = await target.designs.toArray();
    expect(all).toHaveLength(2);
    expect(all.find((item) => item.id === local.id)?.name).toBe('My local poster');
    expect(all.some((item) => item.name === 'Poster (restored)')).toBe(true);
  });

  it('brings designs back from Recently deleted', async () => {
    const source = await library();
    await source.designs.remove(source.poster.id);
    const zip = await createBackupZip(await collectBackupContents(source.db), { kind: 'backup' });
    const target = database();
    const summary = await restoreBackup(target, await readBackupZip(zip), { copyName });
    expect(summary.designs).toBe(1);
    const restored = await target.designs.get(source.poster.id);
    expect(restored?.deletedAt).toBeUndefined();
  });
});
