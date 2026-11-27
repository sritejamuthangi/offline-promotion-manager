const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/**
 * Continues a CRC-32 over more bytes. Start with `0`; feeding data in parts gives the same
 * result as all at once, so large files can be checked piece by piece.
 */
export function crc32Update(crc: number, bytes: Uint8Array, start = 0, end = bytes.length): number {
  let c = ~crc >>> 0;
  for (let i = start; i < end; i++) c = (CRC_TABLE[(c ^ (bytes[i] ?? 0)) & 0xff] ?? 0) ^ (c >>> 8);
  return ~c >>> 0;
}

/** CRC-32 as used by PNG chunks and ZIP files. */
export function crc32(bytes: Uint8Array, start = 0, end = bytes.length): number {
  return crc32Update(0, bytes, start, end);
}
