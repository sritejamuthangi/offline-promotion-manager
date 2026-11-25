/**
 * UUID version 7 (RFC 9562): a 48-bit Unix-millisecond timestamp followed by 74 random bits.
 *
 * IDs created later sort after IDs created earlier, which keeps database indexes compact
 * and will make syncing designs between devices simpler if a server is ever added.
 */
export function uuidv7(now: number = Date.now(), random?: Uint8Array): string {
  if (!Number.isInteger(now) || now < 0 || now > MAX_TIMESTAMP) {
    throw new RangeError(`uuidv7: timestamp out of range: ${now}`);
  }
  const rand = random ?? crypto.getRandomValues(new Uint8Array(10));
  if (rand.length < 10) {
    throw new RangeError('uuidv7: needs at least 10 random bytes');
  }

  const bytes = new Uint8Array(16);
  let ts = now;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ts % 256;
    ts = Math.floor(ts / 256);
  }
  bytes[6] = 0x70 | (byteAt(rand, 0) & 0x0f); // version 7 + 4 random bits
  bytes[7] = byteAt(rand, 1);
  bytes[8] = 0x80 | (byteAt(rand, 2) & 0x3f); // RFC 9562 variant (0b10) + 6 random bits
  for (let i = 9; i < 16; i++) {
    bytes[i] = byteAt(rand, i - 6);
  }

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Largest timestamp a v7 UUID can hold (2^48 - 1 ms, around the year 10889). */
const MAX_TIMESTAMP = 0xffff_ffff_ffff;

export const UUID_V7_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Reads the creation time (Unix ms) back out of a v7 UUID. */
export function timestampOfUuidv7(id: string): number {
  return Number.parseInt(id.slice(0, 8) + id.slice(9, 13), 16);
}

/** Creates a new unique ID for designs, pages, elements and assets. */
export function newId(): string {
  return uuidv7();
}

function byteAt(bytes: Uint8Array, index: number): number {
  return bytes[index] ?? 0;
}
