import { crc32Update } from './crc32';

/**
 * ZIP files, as used for backups and design files: stored or deflated entries with UTF-8
 * names. Large files are streamed: stored entries are never copied into memory, and every
 * entry is checked against its size and CRC-32. ZIP64 (over 4 GB or 65,535 files) and
 * encrypted entries are not supported.
 */

export type ZipErrorCode = 'notZip' | 'unsupported' | 'damaged' | 'tooLarge';

export class ZipError extends Error {
  readonly code: ZipErrorCode;

  constructor(code: ZipErrorCode, message: string) {
    super(message);
    this.name = 'ZipError';
    this.code = code;
  }
}

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_DIRECTORY = 0x06054b50;
const UTF8_NAMES = 0x0800;
const STORED = 0;
const DEFLATED = 8;
const MAX_32 = 0xffffffff;
const MAX_ENTRIES = 0xffff;

export interface ZipInput {
  /** Path inside the ZIP file, with forward slashes. */
  name: string;
  data: Blob | Uint8Array;
  /** Deflate when that makes the entry smaller; pictures are already compressed. */
  compress?: boolean;
}

export interface ZipEntry {
  name: string;
  method: number;
  crc: number;
  compressedSize: number;
  size: number;
  offset: number;
  encrypted: boolean;
}

const asPart = (bytes: Uint8Array) => bytes as Uint8Array<ArrayBuffer>;

function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.min(2107, Math.max(1980, date.getFullYear()));
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array | undefined> {
  if (typeof CompressionStream === 'undefined') return undefined;
  const stream = new Blob([asPart(bytes)])
    .stream()
    .pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** CRC-32 of a blob, read in parts, so a large picture is never held in memory twice. */
async function blobCrc(blob: Blob): Promise<number> {
  let crc = 0;
  const reader = blob.stream().getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return crc;
    crc = crc32Update(crc, value);
  }
}

/** Builds a ZIP file. Blob entries are referenced, not copied. */
export async function createZip(
  inputs: readonly ZipInput[],
  modified: Date = new Date(),
): Promise<Blob> {
  if (inputs.length > MAX_ENTRIES) throw new ZipError('tooLarge', 'Too many files for one ZIP.');
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(modified);
  const parts: BlobPart[] = [];
  const directory: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;
  for (const input of inputs) {
    const name = encoder.encode(input.name);
    let size: number;
    let crc: number;
    let method = STORED;
    let body: Blob | Uint8Array = input.data;
    if (input.data instanceof Uint8Array) {
      size = input.data.length;
      crc = crc32Update(0, input.data);
      const packed = input.compress ? await deflate(input.data) : undefined;
      if (packed && packed.length < size) {
        method = DEFLATED;
        body = packed;
      }
    } else {
      size = input.data.size;
      crc = await blobCrc(input.data);
    }
    const compressedSize = body instanceof Blob ? body.size : body.length;
    if (size >= MAX_32 || compressedSize >= MAX_32 || offset + compressedSize >= MAX_32)
      throw new ZipError('tooLarge', 'The ZIP file would be larger than 4 GB.');

    const local = new Uint8Array(30 + name.length);
    const l = new DataView(local.buffer);
    l.setUint32(0, LOCAL_HEADER, true);
    l.setUint16(4, 20, true);
    l.setUint16(6, UTF8_NAMES, true);
    l.setUint16(8, method, true);
    l.setUint16(10, time, true);
    l.setUint16(12, date, true);
    l.setUint32(14, crc, true);
    l.setUint32(18, compressedSize, true);
    l.setUint32(22, size, true);
    l.setUint16(26, name.length, true);
    local.set(name, 30);

    const central = new Uint8Array(46 + name.length);
    const c = new DataView(central.buffer);
    c.setUint32(0, CENTRAL_HEADER, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, UTF8_NAMES, true);
    c.setUint16(10, method, true);
    c.setUint16(12, time, true);
    c.setUint16(14, date, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, compressedSize, true);
    c.setUint32(24, size, true);
    c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    central.set(name, 46);

    parts.push(local, body instanceof Blob ? body : asPart(body));
    directory.push(central);
    offset += local.length + compressedSize;
  }
  const directorySize = directory.reduce((sum, entry) => sum + entry.length, 0);
  if (offset + directorySize >= MAX_32)
    throw new ZipError('tooLarge', 'The ZIP file would be larger than 4 GB.');
  const end = new Uint8Array(22);
  const e = new DataView(end.buffer);
  e.setUint32(0, END_OF_DIRECTORY, true);
  e.setUint16(8, inputs.length, true);
  e.setUint16(10, inputs.length, true);
  e.setUint32(12, directorySize, true);
  e.setUint32(16, offset, true);
  return new Blob([...parts, ...directory, end], { type: 'application/zip' });
}

const notZip = () => new ZipError('notZip', 'This is not a ZIP file.');
const damaged = () => new ZipError('damaged', 'The ZIP file is damaged or incomplete.');

/** Lists the files in a ZIP file, from its central directory. */
export async function readZipDirectory(file: Blob): Promise<ZipEntry[]> {
  // The end record is in the last 22 bytes, unless a comment (up to 64 KB) follows it.
  const tailSize = Math.min(file.size, 22 + 0xffff);
  if (tailSize < 22) throw notZip();
  const tail = new DataView(await file.slice(file.size - tailSize).arrayBuffer());
  let end = -1;
  for (let i = tailSize - 22; i >= 0; i--)
    if (tail.getUint32(i, true) === END_OF_DIRECTORY) {
      end = i;
      break;
    }
  if (end < 0) throw notZip();
  const count = tail.getUint16(end + 10, true);
  const directorySize = tail.getUint32(end + 12, true);
  const directoryOffset = tail.getUint32(end + 16, true);
  if (count === MAX_ENTRIES || directorySize === MAX_32 || directoryOffset === MAX_32)
    throw new ZipError('unsupported', 'ZIP files over 4 GB (ZIP64) are not supported.');
  if (directoryOffset + directorySize > file.size) throw damaged();

  const directory = new Uint8Array(
    await file.slice(directoryOffset, directoryOffset + directorySize).arrayBuffer(),
  );
  const view = new DataView(directory.buffer);
  const decoder = new TextDecoder();
  const entries: ZipEntry[] = [];
  let p = 0;
  for (let i = 0; i < count; i++) {
    if (p + 46 > directory.length || view.getUint32(p, true) !== CENTRAL_HEADER) throw damaged();
    const nameLength = view.getUint16(p + 28, true);
    const next = p + 46 + nameLength + view.getUint16(p + 30, true) + view.getUint16(p + 32, true);
    if (next > directory.length) throw damaged();
    entries.push({
      name: decoder.decode(directory.subarray(p + 46, p + 46 + nameLength)),
      method: view.getUint16(p + 10, true),
      crc: view.getUint32(p + 16, true),
      compressedSize: view.getUint32(p + 20, true),
      size: view.getUint32(p + 24, true),
      offset: view.getUint32(p + 42, true),
      encrypted: (view.getUint16(p + 8, true) & 1) === 1,
    });
    p = next;
  }
  return entries;
}

/**
 * Reads one file of a ZIP file, checking its size and CRC-32. Stored files are returned as
 * a slice of the ZIP file (nothing is copied); deflated files are expanded, never beyond
 * their declared size, which must not exceed `maxSize`.
 */
export async function readZipEntry(
  file: Blob,
  entry: ZipEntry,
  options: { maxSize: number; type?: string },
): Promise<Blob> {
  if (entry.encrypted)
    throw new ZipError('unsupported', 'Password-protected ZIP files are not supported.');
  if (entry.method !== STORED && entry.method !== DEFLATED)
    throw new ZipError('unsupported', 'This ZIP file uses an unsupported compression method.');
  if (entry.size > options.maxSize)
    throw new ZipError('tooLarge', `“${entry.name}” is larger than allowed.`);
  const header = new DataView(await file.slice(entry.offset, entry.offset + 30).arrayBuffer());
  if (header.byteLength < 30 || header.getUint32(0, true) !== LOCAL_HEADER) throw damaged();
  const start = entry.offset + 30 + header.getUint16(26, true) + header.getUint16(28, true);
  const data = file.slice(start, start + entry.compressedSize);
  if (start + entry.compressedSize > file.size) throw damaged();

  let stream: ReadableStream<Uint8Array> = data.stream();
  if (entry.method === DEFLATED) {
    if (typeof DecompressionStream === 'undefined')
      throw new ZipError('unsupported', 'This browser cannot open compressed ZIP files.');
    // The DOM types describe the stream's chunks more loosely than the reader uses them.
    stream = stream.pipeThrough(
      new DecompressionStream('deflate-raw') as unknown as ReadableWritablePair<
        Uint8Array,
        Uint8Array
      >,
    );
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  let crc = 0;
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      // More data than declared: damaged, or a "ZIP bomb". Stop before it fills memory.
      if (size > entry.size) throw damaged();
      crc = crc32Update(crc, value);
      if (entry.method === DEFLATED) chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error instanceof ZipError ? error : damaged();
  }
  if (size !== entry.size || crc !== entry.crc) throw damaged();
  return entry.method === STORED
    ? data.slice(0, data.size, options.type)
    : new Blob(chunks.map(asPart), { type: options.type ?? '' });
}
