import { describe, expect, it } from 'vitest';
import { BACKUP_FORMAT, BACKUP_MANIFEST, BACKUP_VERSION, type TemplateData } from './backup';
import { type BackupContents, BackupError, createBackupZip, readBackupZip } from './backupFile';
import { createDesign } from './design/factory';
import { hashBlob } from './hash';
import { createZip } from './zip';

const encoder = new TextEncoder();
const design = (name: string, now = 1000) =>
  createDesign({ name, width: 400, height: 300, unit: 'px', now });

const templateDesign = design('Menu template', 2000);
const template: TemplateData = {
  id: 't1',
  name: 'Menu template',
  category: 'food',
  createdAt: 2000,
  updatedAt: 2000,
  design: templateDesign,
};

const contents = (): BackupContents => ({
  designs: [design('Poster')],
  templates: [template],
  assets: [
    {
      id: 'a1',
      name: 'photo.png',
      type: 'image/png',
      width: 10,
      height: 20,
      createdAt: 3000,
      source: { kind: 'openverse', license: 'CC BY 4.0' },
      blob: new Blob(['picture bytes'], { type: 'image/png' }),
    },
  ],
});

const manifest = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    kind: 'backup',
    createdAt: 5000,
    designs: [],
    templates: [],
    assets: [],
    ...overrides,
  });

describe('backup files', () => {
  it('writes and reads a backup with designs, templates, pictures and their licences', async () => {
    const zip = await createBackupZip(contents(), {
      kind: 'backup',
      now: 5000,
      app: 'Offline Promotion Manager',
    });
    const file = await readBackupZip(zip);
    expect(file.issues).toEqual([]);
    expect(file.manifest.kind).toBe('backup');
    expect(file.manifest.app).toBe('Offline Promotion Manager');
    expect(file.manifest.createdAt).toBe(5000);
    expect(file.designs.map((item) => item.name)).toEqual(['Poster']);
    expect(file.templates[0]?.category).toBe('food');
    expect(file.templates[0]?.design.name).toBe('Menu template');
    expect(file.assets).toHaveLength(1);
    expect(file.assets[0]).toMatchObject({
      id: 'a1',
      name: 'photo.png',
      type: 'image/png',
      width: 10,
      height: 20,
      source: { kind: 'openverse', license: 'CC BY 4.0' },
    });
    const asset = file.assets[0];
    if (!asset) throw new Error('Expected one picture.');
    const picture = await file.readAsset(asset);
    expect(await picture.text()).toBe('picture bytes');
    expect(asset.hash).toBe(await hashBlob(picture));
  });

  it('writes a design file with one design and its pictures', async () => {
    const zip = await createBackupZip(contents(), { kind: 'design', now: 6000 });
    const file = await readBackupZip(zip);
    expect(file.manifest.kind).toBe('design');
    expect(file.designs).toHaveLength(1);
    expect(file.templates).toHaveLength(1);
  });

  it('reports damaged items but still opens the rest of the file', async () => {
    const good = design('Good');
    const zip = await createZip([
      {
        name: BACKUP_MANIFEST,
        data: encoder.encode(
          manifest({
            designs: [42, good],
            templates: [{ id: 'bad', name: 'Bad', design: { nope: true } }],
            assets: [
              {
                id: 'missing',
                name: 'gone.png',
                type: 'image/png',
                createdAt: 1,
                source: { kind: 'upload' },
                file: 'images/gone.png',
              },
            ],
          }),
        ),
        compress: true,
      },
    ]);
    const file = await readBackupZip(zip);
    expect(file.designs.map((item) => item.name)).toEqual(['Good']);
    expect(file.templates).toEqual([]);
    expect(file.assets).toEqual([]);
    expect(file.issues.map((issue) => issue.name)).toEqual(['design 1', 'template 1', 'picture 1']);
  });

  it('rejects other ZIP files, newer formats and damaged tables of contents', async () => {
    const other = await createZip([{ name: 'notes.txt', data: encoder.encode('hi') }]);
    await expect(readBackupZip(other)).rejects.toMatchObject({
      name: 'BackupError',
      code: 'notBackup',
    });

    const newer = await createZip([
      {
        name: BACKUP_MANIFEST,
        data: encoder.encode(manifest({ version: BACKUP_VERSION + 1 })),
      },
    ]);
    await expect(readBackupZip(newer)).rejects.toMatchObject({ code: 'newerVersion' });

    const broken = await createZip([{ name: BACKUP_MANIFEST, data: encoder.encode('{not json') }]);
    await expect(readBackupZip(broken)).rejects.toMatchObject({ code: 'damaged' });

    const wrong = await createZip([
      {
        name: BACKUP_MANIFEST,
        data: encoder.encode(manifest({ format: 'something-else' })),
      },
    ]);
    await expect(readBackupZip(wrong)).rejects.toBeInstanceOf(BackupError);
    await expect(readBackupZip(wrong)).rejects.toMatchObject({ code: 'notBackup' });
  });

  it('reports progress while checking pictures', async () => {
    const original = contents();
    const first = original.assets[0];
    if (!first) throw new Error('Expected one picture.');
    const data = {
      ...original,
      assets: [
        ...original.assets,
        {
          ...first,
          id: 'a2',
          name: 'second.png',
          blob: new Blob(['another picture'], { type: 'image/png' }),
        },
      ],
    };
    const zip = await createBackupZip(data, { kind: 'backup' });
    const steps: Array<[number, number]> = [];
    await readBackupZip(zip, (done, total) => steps.push([done, total]));
    expect(steps[0]).toEqual([0, 2]);
    expect(steps.at(-1)).toEqual([2, 2]);
  });
});
