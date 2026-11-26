import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDexieAssetRepository, hashBlob } from './assetRepository';
import { type AppDatabase, openDatabase } from './db';

let db: AppDatabase;
let now: number;

const repository = () =>
  createDexieAssetRepository(
    db,
    () => now,
    (blob) => blob.text(),
    async () => ({ width: 800, height: 600 }),
  );

beforeEach(() => {
  now = 1_000;
  db = openDatabase(`test-assets-${crypto.randomUUID()}`);
});

afterEach(async () => {
  db.close();
  await Dexie.delete(db.name);
});

describe('DexieAssetRepository', () => {
  it('stores an image and reads its dimensions', async () => {
    const repo = repository();
    const asset = await repo.add({
      blob: new Blob(['first'], { type: 'image/png' }),
      name: 'photo.png',
    });
    expect(asset.name).toBe('photo.png');
    expect(asset.type).toBe('image/png');
    expect(asset.size).toBe(5);
    expect(asset.width).toBe(800);
    expect(asset.height).toBe(600);
    expect(asset.hash).toBe('first');
    expect(asset.createdAt).toBe(now);
    expect(await repo.get(asset.id)).toEqual(asset);
  });

  it('deduplicates identical bytes', async () => {
    const repo = repository();
    const first = await repo.add({ blob: new Blob(['same']), name: 'one.png' });
    now = 2_000;
    const second = await repo.add({ blob: new Blob(['same']), name: 'two.png' });
    expect(second.id).toBe(first.id);
    expect(second.name).toBe('one.png');
    expect(await repo.list()).toHaveLength(1);
  });

  it('keeps different bytes as separate assets', async () => {
    const repo = repository();
    now = 1_000;
    const first = await repo.add({ blob: new Blob(['one']), name: 'one.png' });
    now = 2_000;
    const second = await repo.add({ blob: new Blob(['two']), name: 'two.png' });
    expect(second.id).not.toBe(first.id);
    expect((await repo.list()).map((asset) => asset.name)).toEqual(['two.png', 'one.png']);
  });

  it('preserves discovered credits when online bytes match an existing upload', async () => {
    const repo = repository();
    const blob = new Blob(['shared'], { type: 'image/png' });
    const upload = await repo.add({ blob, name: 'upload.png' });
    const source = {
      kind: 'openverse' as const,
      attribution: 'Photo by Jane (CC BY 4.0)',
      license: 'CC BY 4.0',
    };
    const result = await repo.add({ blob, name: 'online.png', source });
    expect(result.id).toBe(upload.id);
    expect((await repo.get(upload.id))?.source).toEqual(source);
    expect((await repo.add({ blob, name: 'again.png' })).source).toEqual(source);
    expect(await repo.list()).toHaveLength(1);
  });

  it('rejects empty files', async () => {
    await expect(repository().add({ blob: new Blob([]), name: 'empty.png' })).rejects.toThrow(
      RangeError,
    );
  });

  it('removes an asset', async () => {
    const repo = repository();
    const asset = await repo.add({ blob: new Blob(['gone']), name: 'gone.png' });
    await repo.remove(asset.id);
    expect(await repo.get(asset.id)).toBeUndefined();
    expect(await repo.list()).toEqual([]);
  });
});

describe('hashBlob', () => {
  it('hashes identical content the same way', async () => {
    expect(await hashBlob(new Blob(['content']))).toBe(await hashBlob(new Blob(['content'])));
  });

  it('separates different content', async () => {
    expect(await hashBlob(new Blob(['one']))).not.toBe(await hashBlob(new Blob(['two'])));
  });
});
