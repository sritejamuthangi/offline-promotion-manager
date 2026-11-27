import { describe, expect, it } from 'vitest';
import { createZip, readZipDirectory, readZipEntry, ZipError } from './zip';

const encoder = new TextEncoder();
const bytesOf = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());
const textOf = (blob: Blob) => blob.text();

async function onlyEntry(zip: Blob) {
  const entries = await readZipDirectory(zip);
  expect(entries).toHaveLength(1);
  const [entry] = entries;
  if (!entry) throw new Error('Expected one entry.');
  return entry;
}

describe('ZIP files', () => {
  it('round-trips stored and deflated entries with UTF-8 names', async () => {
    const long = 'repeat me '.repeat(200);
    const zip = await createZip([
      { name: 'backup.json', data: encoder.encode('{"hello":"world"}'), compress: true },
      { name: 'images/naïve – 東京.png', data: encoder.encode('picture') },
      { name: 'notes.txt', data: encoder.encode(long), compress: true },
    ]);
    expect(zip.type).toBe('application/zip');

    const entries = await readZipDirectory(zip);
    expect(entries.map((entry) => entry.name)).toEqual([
      'backup.json',
      'images/naïve – 東京.png',
      'notes.txt',
    ]);
    expect(entries[1]?.method).toBe(0);
    // Deflating a long text saves space.
    expect(entries[2]?.method).toBe(8);
    expect(entries[2]?.compressedSize).toBeLessThan(entries[2]?.size ?? 0);

    const [manifest, picture, notes] = entries;
    if (!manifest || !picture || !notes) throw new Error('Expected three entries.');
    expect(await textOf(await readZipEntry(zip, manifest, { maxSize: 1000 }))).toBe(
      '{"hello":"world"}',
    );
    expect(
      await textOf(await readZipEntry(zip, picture, { maxSize: 1000, type: 'image/png' })),
    ).toBe('picture');
    expect(await textOf(await readZipEntry(zip, notes, { maxSize: 10_000 }))).toBe(long);
  });

  it('stores a blob without copying or changing it', async () => {
    const picture = new Blob(['fake png bytes'], { type: 'image/png' });
    const zip = await createZip([{ name: 'images/a.png', data: picture }]);
    const entry = await onlyEntry(zip);
    expect(entry.method).toBe(0);
    const read = await readZipEntry(zip, entry, { maxSize: 1000, type: 'image/png' });
    expect(read.type).toBe('image/png');
    expect(await textOf(read)).toBe('fake png bytes');
  });

  it('rejects files that are not ZIP files', async () => {
    await expect(readZipDirectory(new Blob(['hello']))).rejects.toMatchObject({
      name: 'ZipError',
      code: 'notZip',
    });
    await expect(readZipDirectory(new Blob([]))).rejects.toMatchObject({ code: 'notZip' });
  });

  it('detects damaged data with its CRC-32', async () => {
    const zip = await createZip([{ name: 'a.txt', data: encoder.encode('hello') }]);
    const bytes = await bytesOf(zip);
    // Local header (30 bytes) + name length; the first data byte.
    bytes[30 + 5] = (bytes[30 + 5] ?? 0) ^ 0xff;
    const damaged = new Blob([bytes]);
    const entry = await onlyEntry(damaged);
    await expect(readZipEntry(damaged, entry, { maxSize: 1000 })).rejects.toMatchObject({
      code: 'damaged',
    });
  });

  it('refuses an entry that expands beyond its declared size', async () => {
    const zip = await createZip([
      { name: 'a.txt', data: encoder.encode('a'.repeat(5000)), compress: true },
    ]);
    const entry = await onlyEntry(zip);
    await expect(
      readZipEntry(zip, { ...entry, size: 10 }, { maxSize: 10_000 }),
    ).rejects.toBeInstanceOf(ZipError);
    await expect(
      readZipEntry(zip, { ...entry, size: 10 }, { maxSize: 10_000 }),
    ).rejects.toMatchObject({ code: 'damaged' });
  });

  it('refuses entries larger than allowed, encrypted or compressed in another way', async () => {
    const zip = await createZip([{ name: 'a.txt', data: encoder.encode('hello') }]);
    const entry = await onlyEntry(zip);
    await expect(readZipEntry(zip, { ...entry, size: 100 }, { maxSize: 10 })).rejects.toMatchObject(
      {
        code: 'tooLarge',
      },
    );
    await expect(
      readZipEntry(zip, { ...entry, encrypted: true }, { maxSize: 100 }),
    ).rejects.toMatchObject({ code: 'unsupported' });
    await expect(
      readZipEntry(zip, { ...entry, method: 12 }, { maxSize: 100 }),
    ).rejects.toMatchObject({ code: 'unsupported' });
  });

  it('checks the central directory against the file', async () => {
    const zip = await createZip([{ name: 'a.txt', data: encoder.encode('hello') }]);
    const bytes = await bytesOf(zip);
    // Claim the directory starts beyond the end of the file.
    const view = new DataView(bytes.buffer);
    view.setUint32(bytes.length - 22 + 16, bytes.length + 100, true);
    await expect(readZipDirectory(new Blob([bytes]))).rejects.toMatchObject({ code: 'damaged' });
  });
});
