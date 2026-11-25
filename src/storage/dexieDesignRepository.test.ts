import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDesign } from '@/core/design/factory';
import type { Design } from '@/core/schema';
import { type AppDatabase, openDatabase } from './db';
import { createDexieDesignRepository } from './dexieDesignRepository';
import { DesignNotFoundError, type DesignRepository } from './repositories';

let db: AppDatabase;
let repo: DesignRepository;
let now: number;

const make = (name: string, at: number): Design =>
  createDesign({ name, width: 794, height: 1123, unit: 'mm', now: at });

beforeEach(() => {
  now = 1_000_000;
  db = openDatabase(`test-${crypto.randomUUID()}`);
  repo = createDexieDesignRepository(db, () => now);
});

afterEach(async () => {
  db.close();
  await Dexie.delete(db.name);
});

describe('DexieDesignRepository', () => {
  it('saves and loads designs', async () => {
    const design = make('Poster', 1);
    await repo.save(design);
    expect(await repo.get(design.id)).toEqual(design);
    expect(await repo.get('missing')).toBeUndefined();
  });

  it('lists the most recently edited designs first', async () => {
    const older = make('Older', 1);
    const newer = make('Newer', 2);
    await repo.save(older);
    await repo.save(newer);
    expect((await repo.list()).map((d) => d.name)).toEqual(['Newer', 'Older']);
  });

  it('refuses to store invalid designs', async () => {
    const broken = { ...make('Broken', 1), pages: [] } as Design;
    await expect(repo.save(broken)).rejects.toThrow();
    expect(await repo.list()).toEqual([]);
  });

  it('renames and bumps the edit time', async () => {
    const design = make('Old name', 1);
    await repo.save(design);
    now = 5_000_000;
    await repo.rename(design.id, '  New name ');
    const renamed = await repo.get(design.id);
    expect(renamed?.name).toBe('New name');
    expect(renamed?.updatedAt).toBe(5_000_000);
    await expect(repo.rename(design.id, '   ')).rejects.toThrow(RangeError);
    await expect(repo.rename('missing', 'x')).rejects.toThrow(DesignNotFoundError);
  });

  it('duplicates a design under a new ID', async () => {
    const design = make('Flyer', 1);
    await repo.save(design);
    const copy = await repo.duplicate(design.id, 'Flyer (copy)');
    expect(copy.id).not.toBe(design.id);
    expect((await repo.list()).map((d) => d.name).sort()).toEqual(['Flyer', 'Flyer (copy)']);
    await expect(repo.duplicate('missing', 'x')).rejects.toThrow(DesignNotFoundError);
  });

  it('moves designs to Recently deleted and restores them', async () => {
    const design = make('Card', 1);
    await repo.save(design);
    now = 7_000_000;
    await repo.remove(design.id);
    expect(await repo.list()).toEqual([]);
    const deleted = await repo.listDeleted();
    expect(deleted.map((d) => d.deletedAt)).toEqual([7_000_000]);

    await repo.restore(design.id);
    expect((await repo.list()).map((d) => d.id)).toEqual([design.id]);
    expect(await repo.listDeleted()).toEqual([]);
    expect((await repo.get(design.id))?.deletedAt).toBeUndefined();
  });

  it('purges only designs deleted before the cut-off', async () => {
    const old = make('Old', 1);
    const recent = make('Recent', 2);
    const kept = make('Kept', 3);
    await Promise.all([repo.save(old), repo.save(recent), repo.save(kept)]);
    now = 100;
    await repo.remove(old.id);
    now = 900;
    await repo.remove(recent.id);

    expect(await repo.purgeDeleted(500)).toBe(1);
    expect(await repo.get(old.id)).toBeUndefined();
    expect(await repo.get(recent.id)).toBeDefined();
    expect(await repo.get(kept.id)).toBeDefined();
  });

  it('deletes forever', async () => {
    const design = make('Gone', 1);
    await repo.save(design);
    await repo.destroy(design.id);
    expect(await repo.get(design.id)).toBeUndefined();
  });
});
