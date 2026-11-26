import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDesign } from '@/core/design/factory';
import type { Design } from '@/core/schema';
import { type AppDatabase, openDatabase } from './db';
import { createDexieTemplateRepository, TemplateNotFoundError } from './templateRepository';

let db: AppDatabase;
let now: number;
const repository = () => createDexieTemplateRepository(db, () => now);
const design = (name = 'Poster') => createDesign({ name, width: 400, height: 600, unit: 'px' });

beforeEach(() => {
  now = 1_000;
  db = openDatabase(`test-templates-${crypto.randomUUID()}`);
});

afterEach(async () => {
  db.close();
  await Dexie.delete(db.name);
});

describe('DexieTemplateRepository', () => {
  it('saves a validated copy of a design', async () => {
    const repo = repository();
    const source = { ...design(), deletedAt: 3 };
    const saved = await repo.create({ name: '  Club poster ', category: 'events', design: source });
    expect(saved.name).toBe('Club poster');
    expect(saved.category).toBe('events');
    expect(saved.design.name).toBe('Club poster');
    expect(saved.design.deletedAt).toBeUndefined();
    expect(saved.createdAt).toBe(1_000);
    source.name = 'Changed later';
    expect((await repo.get(saved.id))?.design.name).toBe('Club poster');
  });

  it('refuses invalid designs', async () => {
    const broken = { ...design(), pages: [] } as Design;
    await expect(repository().create({ name: 'Broken', design: broken })).rejects.toThrow();
    expect(await repository().list()).toEqual([]);
  });

  it('lists the most recently changed first and renames', async () => {
    const repo = repository();
    const first = await repo.create({ name: 'First', design: design() });
    now = 2_000;
    const second = await repo.create({ name: 'Second', design: design() });
    expect((await repo.list()).map((t) => t.id)).toEqual([second.id, first.id]);
    now = 3_000;
    await repo.rename(first.id, 'Renamed');
    const list = await repo.list();
    expect(list.map((t) => t.name)).toEqual(['Renamed', 'Second']);
    expect(list[0]?.design.name).toBe('Renamed');
    await expect(repo.rename(first.id, '   ')).rejects.toThrow(RangeError);
    await expect(repo.rename('missing', 'Name')).rejects.toThrow(TemplateNotFoundError);
  });

  it('removes a template', async () => {
    const repo = repository();
    const saved = await repo.create({ name: 'Gone', design: design() });
    await repo.remove(saved.id);
    expect(await repo.get(saved.id)).toBeUndefined();
  });

  it('upgrades a version 1 database without losing designs', async () => {
    const name = `test-upgrade-${crypto.randomUUID()}`;
    const old = new Dexie(name);
    old.version(1).stores({ designs: 'id, updatedAt, createdAt', assets: 'id, hash, createdAt' });
    const kept = design('Kept');
    await old.table('designs').add(kept);
    old.close();
    const upgraded = openDatabase(name);
    expect((await upgraded.designs.get(kept.id))?.name).toBe('Kept');
    expect(await upgraded.templates.count()).toBe(0);
    upgraded.close();
    await Dexie.delete(name);
  });
});
