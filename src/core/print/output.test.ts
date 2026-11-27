import { describe, expect, it } from 'vitest';
import { toPx } from '../units';
import { crc32, setJpegDpi, setPngDpi } from './imageMeta';
import { createPdf, type PdfPage, pdfNumber, pdfText } from './pdf';
import { DESKTOP_MAX_PIXELS, MAX_CANVAS_SIDE, MOBILE_MAX_PIXELS, rasterSize } from './raster';
import { coversAny, parseUnicodeRange } from './unicodeRange';

const latin1 = (bytes: Uint8Array) => Array.from(bytes, (b) => String.fromCharCode(b)).join('');
const ascii = (text: string) => Uint8Array.from(text, (ch) => ch.charCodeAt(0));

describe('PDF writer', () => {
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
  const page = (overrides: Partial<PdfPage> = {}): PdfPage => ({
    width: 200,
    height: 100,
    image: { jpeg, width: 40, height: 20 },
    imageBox: { x: 10, y: 10, width: 80, height: 50 },
    ...overrides,
  });

  it('writes a valid file whose cross-reference table points at every object', () => {
    const bytes = createPdf(
      [page({ lines: [{ x1: 0, y1: 5, x2: 8, y2: 5 }] }), page({ width: 300 })],
      { title: 'Spring sale', creator: 'Test', created: new Date(Date.UTC(2026, 0, 2, 3, 4, 5)) },
    );
    const text = latin1(bytes);
    expect(text.startsWith('%PDF-1.6\n')).toBe(true);
    expect(text.endsWith('%%EOF\n')).toBe(true);
    const start = Number(/startxref\n(\d+)\n/.exec(text)?.[1]);
    expect(text.slice(start, start + 4)).toBe('xref');
    const entries = [...text.slice(start).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) =>
      Number(m[1]),
    );
    expect(entries).toHaveLength(9);
    entries.forEach((offset, i) => {
      expect(text.startsWith(`${i + 1} 0 obj\n`, offset)).toBe(true);
    });
    expect(text.match(/\/Type \/Page /g)).toHaveLength(2);
    expect(text).toContain('/Count 2');
    expect(text).toContain('/MediaBox [0 0 300 100]');
    expect(text).toContain('/Title (Spring sale)');
    expect(text).toContain('/CreationDate (D:20260102030405Z)');
    expect(text).toContain('/Filter /DCTDecode /Length 4 >>');
    // The image box is flipped to PDF's bottom-left origin.
    expect(text).toContain('80 0 0 50 10 40 cm');
    expect(text).toContain('0 95 m 8 95 l S');
  });

  it('records trim and bleed boxes for print shops', () => {
    const text = latin1(
      createPdf([
        page({
          trimBox: { x: 10, y: 10, width: 80, height: 50 },
          bleedBox: { x: 5, y: 5, width: 90, height: 60 },
        }),
      ]),
    );
    expect(text).toContain('/TrimBox [10 40 90 90]');
    expect(text).toContain('/BleedBox [5 35 95 95]');
  });

  it('preserves the physical size of banners longer than 200 inches', () => {
    const text = latin1(
      createPdf([
        page({
          width: 30_000,
          height: 3_000,
          imageBox: { x: 0, y: 0, width: 30_000, height: 3_000 },
          trimBox: { x: 0, y: 0, width: 30_000, height: 3_000 },
          lines: [{ x1: 0, y1: 0, x2: 30_000, y2: 0 }],
        }),
      ]),
    );
    expect(text).toContain('/UserUnit 3');
    expect(text).toContain('/MediaBox [0 0 10000 1000]');
    expect(text).toContain('/TrimBox [0 0 10000 1000]');
    expect(text).toContain('10000 0 0 1000 0 0 cm');
    expect(text).toContain('0 1000 m 10000 1000 l S');
  });

  it('formats numbers and text safely', () => {
    expect(pdfNumber(1.23456)).toBe('1.235');
    expect(pdfNumber(10)).toBe('10');
    expect(pdfNumber(100)).toBe('100');
    expect(pdfNumber(-0.0001)).toBe('0');
    expect(pdfNumber(Number.NaN)).toBe('0');
    expect(pdfText('Sale (50%) \\ more')).toBe('(Sale \\(50%\\) \\\\ more)');
    expect(pdfText('Café')).toBe('<FEFF00430061006600E9>');
  });
});

describe('image resolution metadata', () => {
  const chunk = (type: string, data: number[]) => {
    const body = Uint8Array.from([...ascii(type), ...data]);
    const out = new Uint8Array(12 + data.length);
    const view = new DataView(out.buffer);
    view.setUint32(0, data.length);
    out.set(body, 4);
    view.setUint32(8 + data.length, crc32(body));
    return [...out];
  };
  const png = Uint8Array.from([
    137,
    80,
    78,
    71,
    13,
    10,
    26,
    10,
    ...chunk('IHDR', [0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0]),
    ...chunk('IDAT', [1, 2, 3]),
    ...chunk('IEND', []),
  ]);

  it('computes PNG checksums', () => {
    expect(crc32(ascii('IEND'))).toBe(0xae426082);
  });

  it('adds a pHYs chunk after the header, replacing any earlier one', () => {
    const tagged = setPngDpi(setPngDpi(png, 72), 300);
    const text = latin1(tagged);
    expect(text.match(/pHYs/g)).toHaveLength(1);
    const at = text.indexOf('pHYs');
    expect(at).toBeGreaterThan(text.indexOf('IHDR'));
    expect(at).toBeLessThan(text.indexOf('IDAT'));
    const view = new DataView(tagged.buffer, tagged.byteOffset);
    expect(view.getUint32(at + 4)).toBe(11811);
    expect(view.getUint32(at + 8)).toBe(11811);
    expect(tagged[at + 12]).toBe(1);
    expect(view.getUint32(at + 13)).toBe(crc32(tagged, at, at + 13));
    expect(tagged.length).toBe(png.length + 21);
  });

  it('sets the JFIF density of a JPEG, adding the header when missing', () => {
    const jfif = Uint8Array.from([
      0xff,
      0xd8,
      0xff,
      0xe0,
      0,
      16,
      ...ascii('JFIF'),
      0,
      1,
      1,
      0,
      0,
      1,
      0,
      1,
      0,
      0,
      0xff,
      0xd9,
    ]);
    const tagged = setJpegDpi(jfif, 300);
    expect([...tagged.subarray(13, 18)]).toEqual([1, 1, 44, 1, 44]);
    expect(tagged.length).toBe(jfif.length);

    const bare = Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0, 2, 0xff, 0xd9]);
    const added = setJpegDpi(bare, 150);
    expect(latin1(added.subarray(6, 11))).toBe('JFIF\0');
    expect([...added.subarray(13, 18)]).toEqual([1, 0, 150, 0, 150]);
    expect([...added.subarray(20)]).toEqual([0xff, 0xdb, 0, 2, 0xff, 0xd9]);

    expect(setJpegDpi(png, 300)).toBe(png);
  });
});

describe('export size', () => {
  const a4 = { width: toPx(210, 'mm'), height: toPx(297, 'mm') };

  it('converts the page size to pixels at the chosen resolution', () => {
    expect(rasterSize(a4, 300, MOBILE_MAX_PIXELS)).toEqual({
      width: 2480,
      height: 3508,
      dpi: 300,
      reduced: false,
    });
    expect(rasterSize({ width: 1080, height: 1080 }, 96, MOBILE_MAX_PIXELS)).toMatchObject({
      width: 1080,
      height: 1080,
    });
  });

  it('lowers the resolution to stay within canvas limits', () => {
    const a1 = { width: toPx(594, 'mm'), height: toPx(841, 'mm') };
    const big = rasterSize(a1, 300, DESKTOP_MAX_PIXELS);
    expect(big.reduced).toBe(true);
    expect(big.dpi).toBeLessThan(300);
    expect(big.width * big.height).toBeLessThanOrEqual(DESKTOP_MAX_PIXELS);
    const banner = rasterSize({ width: toPx(850, 'mm'), height: toPx(2000, 'mm') }, 300, 1e12);
    expect(banner.height).toBeLessThanOrEqual(MAX_CANVAS_SIDE);
  });
});

describe('unicode ranges', () => {
  it('parses ranges, single code points and wildcards', () => {
    expect(parseUnicodeRange('U+0000-00FF, U+0131, U+4??')).toEqual([
      [0, 0xff],
      [0x131, 0x131],
      [0x400, 0x4ff],
    ]);
    expect(parseUnicodeRange('U+0-FF')).toEqual([[0, 0xff]]);
    expect(parseUnicodeRange('')).toEqual([]);
  });

  it('checks whether a font subset is needed for some text', () => {
    const latin = parseUnicodeRange('U+0000-00FF');
    const cyrillic = parseUnicodeRange('U+0400-045F');
    const points = [...'Café'].map((ch) => ch.codePointAt(0) ?? 0);
    expect(coversAny(latin, points)).toBe(true);
    expect(coversAny(cyrillic, points)).toBe(false);
    expect(coversAny([], points)).toBe(true);
  });
});
