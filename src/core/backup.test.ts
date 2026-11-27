import { describe, expect, it } from 'vitest';
import {
  assetReferences,
  backupImagePath,
  type Inventory,
  planRestore,
  remapAssets,
  type TemplateData,
} from './backup';
import { createDesign } from './design/factory';
import type { Design, ImageElement } from './schema';

const design = (id: string, name: string, updatedAt: number, deleted = false): Design => ({
  ...createDesign({ name, width: 400, height: 300, unit: 'px', now: updatedAt }),
  id,
  updatedAt,
  ...(deleted ? { deletedAt: updatedAt } : {}),
});

const picture = (src: string): ImageElement => ({
  id: 'i1',
  type: 'image',
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  rotation: 0,
  opacity: 1,
  src,
  fit: 'cover',
});

const withPicture = (source: Design, src: string): Design => ({
  ...source,
  pages: source.pages.map((page, index) =>
    index === 0 ? { ...page, elements: [picture(src)] } : page,
  ),
});

const inventory = (options: {
  designs?: Array<[string, number, boolean]>;
  templates?: Array<[string, number]>;
  assets?: Array<[string, string]>;
}): Inventory => ({
  designs: new Map(
    (options.designs ?? []).map(([id, updatedAt, deleted]) => [id, { updatedAt, deleted }]),
  ),
  templates: new Map(options.templates ?? []),
  assets: new Map(options.assets ?? []),
});

const options = { copyName: (name: string) => `${name} (copy)`, now: 9000 };

const template = (id: string, name: string, updatedAt: number): TemplateData => ({
  id,
  name,
  createdAt: 1,
  updatedAt,
  design: design(`design-${id}`, name, updatedAt),
});

describe('restore planning', () => {
  it('adds new designs and images, keeping their IDs', () => {
    const poster = withPicture(design('d1', 'Poster', 10), 'asset:a1');
    const plan = planRestore(
      { designs: [poster], templates: [], assets: [{ id: 'a1', hash: 'h1' }] },
      inventory({}),
      options,
    );
    expect(plan.summary).toEqual({ designs: 1, templates: 0, images: 1, existing: 0, copies: 0 });
    expect(plan.designs[0]?.id).toBe('d1');
    expect(plan.designs[0]?.pages[0]?.elements[0]).toMatchObject({ src: 'asset:a1' });
    expect(plan.assets).toEqual([{ id: 'a1', hash: 'h1' }]);
    expect(plan.undelete).toEqual([]);
  });

  it('skips identical items and brings back ones in Recently deleted', () => {
    const plan = planRestore(
      {
        designs: [design('d1', 'Poster', 10, true), design('d2', 'Flyer', 20)],
        templates: [template('t1', 'Menu', 30)],
        assets: [{ id: 'a1', hash: 'h1' }],
      },
      inventory({
        designs: [
          ['d1', 10, true],
          ['d2', 20, false],
        ],
        templates: [['t1', 30]],
        assets: [['a1', 'h1']],
      }),
      options,
    );
    expect(plan.summary).toEqual({ designs: 1, templates: 0, images: 0, existing: 3, copies: 0 });
    expect(plan.undelete).toEqual(['d1']);
    expect(plan.designs).toEqual([]);
  });

  it('adds different versions as copies instead of replacing anything', () => {
    const plan = planRestore(
      {
        designs: [design('d1', 'Poster', 99)],
        templates: [template('t1', 'Menu', 99)],
        assets: [],
      },
      inventory({
        designs: [['d1', 10, false]],
        templates: [['t1', 30]],
      }),
      options,
    );
    expect(plan.summary.copies).toBe(2);
    expect(plan.designs[0]?.id).not.toBe('d1');
    expect(plan.designs[0]?.name).toBe('Poster (copy)');
    expect(plan.templates[0]?.id).not.toBe('t1');
    expect(plan.templates[0]?.name).toBe('Menu (copy)');
    expect(plan.templates[0]?.design.name).toBe('Menu (copy)');
  });

  it('uses a picture already on the device, whatever its ID', () => {
    const plan = planRestore(
      {
        designs: [withPicture(design('d1', 'Poster', 10), 'asset:a1')],
        templates: [],
        assets: [{ id: 'a1', hash: 'same' }],
      },
      inventory({ assets: [['b9', 'same']] }),
      options,
    );
    expect(plan.summary).toEqual({ designs: 1, templates: 0, images: 0, existing: 1, copies: 0 });
    expect(plan.assets).toEqual([]);
    expect(plan.designs[0]?.pages[0]?.elements[0]).toMatchObject({ src: 'asset:b9' });
  });

  it('gives a changed picture a new ID and updates the designs that use it', () => {
    const plan = planRestore(
      {
        designs: [withPicture(design('d1', 'Poster', 10), 'asset:a1')],
        templates: [],
        assets: [{ id: 'a1', hash: 'new' }],
      },
      inventory({ assets: [['a1', 'old']] }),
      options,
    );
    expect(plan.summary.images).toBe(1);
    const id = plan.assets[0]?.id;
    expect(id).not.toBe('a1');
    expect(plan.designs[0]?.pages[0]?.elements[0]).toMatchObject({ src: `asset:${id}` });
  });

  it('handles the same picture or the same ID twice in one file', () => {
    const twice = planRestore(
      {
        designs: [],
        templates: [],
        assets: [
          { id: 'a1', hash: 'h1' },
          { id: 'a2', hash: 'h1' },
        ],
      },
      inventory({}),
      options,
    );
    expect(twice.assets).toHaveLength(1);
    expect(twice.summary).toMatchObject({ images: 1, existing: 1 });

    const clashing = planRestore(
      {
        designs: [],
        templates: [],
        assets: [
          { id: 'a1', hash: 'h1' },
          { id: 'a1', hash: 'h2' },
        ],
      },
      inventory({}),
      options,
    );
    expect(clashing.assets).toHaveLength(2);
    expect(new Set(clashing.assets.map((asset) => asset.id)).size).toBe(2);
  });

  it('adds the same design twice in one file only once, then as a copy', () => {
    const plan = planRestore(
      {
        designs: [design('d1', 'Poster', 10), design('d1', 'Poster', 10)],
        templates: [],
        assets: [],
      },
      inventory({}),
      options,
    );
    expect(plan.summary).toMatchObject({ designs: 1, copies: 1 });
    expect(plan.designs[1]?.name).toBe('Poster (copy)');
  });

  it('restores designs out of Recently deleted, without their deleted mark', () => {
    const plan = planRestore(
      { designs: [design('d1', 'Poster', 10, true)], templates: [], assets: [] },
      inventory({}),
      options,
    );
    expect(plan.designs[0]?.deletedAt).toBeUndefined();
  });
});

describe('image references', () => {
  it('finds images in pictures, fills and Smart Grid logos', () => {
    const value = {
      src: 'asset:a',
      logoSrc: 'asset:b',
      cardFill: { type: 'image', src: 'asset:c' },
      nested: [{ src: 'asset:d' }, 'asset:not-a-reference'],
      library: 'library:star',
    };
    expect([...assetReferences(value)].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('changes only image references, and leaves other values alone', () => {
    const value = {
      src: 'asset:a',
      logoSrc: 'asset:b',
      other: 'asset:a',
      items: [{ src: 'asset:c' }],
    };
    expect(remapAssets(value, new Map([['a', 'x']]))).toEqual({
      src: 'asset:x',
      logoSrc: 'asset:b',
      other: 'asset:a',
      items: [{ src: 'asset:c' }],
    });
    expect(remapAssets(value, new Map())).toBe(value);
  });

  it('names image files by type, safely', () => {
    expect(backupImagePath('abc-123', 'image/png')).toBe('images/abc-123.png');
    expect(backupImagePath('abc', 'image/jpeg')).toBe('images/abc.jpg');
    expect(backupImagePath('a/b', 'image/svg+xml')).toBe('images/a_b.svg');
    expect(backupImagePath('a', 'image/x-unknown')).toBe('images/a.img');
  });
});
