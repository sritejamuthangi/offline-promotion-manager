/**
 * A small PDF writer for exported pages: one JPEG picture per page, optional crop-mark
 * lines and print boxes. Coordinates are points (1/72 in) from the page's top-left corner,
 * like the rest of the app; they are flipped to PDF's bottom-left origin here.
 */
export interface PdfBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfImage {
  /** JPEG file bytes in RGB, as browsers encode canvases. */
  jpeg: Uint8Array;
  /** Size of the JPEG in pixels. */
  width: number;
  height: number;
}

export interface PdfPage {
  /** Page size in points. */
  width: number;
  height: number;
  image: PdfImage;
  imageBox: PdfBox;
  /** Black hairlines, e.g. crop marks. */
  lines?: readonly { x1: number; y1: number; x2: number; y2: number }[];
  lineWidth?: number;
  /** The finished size after trimming, for print shops. */
  trimBox?: PdfBox;
  bleedBox?: PdfBox;
}

export interface PdfInfo {
  title?: string;
  creator?: string;
  producer?: string;
  created?: Date;
}

/** Points per CSS px. */
export const PT_PER_PX = 72 / 96;

/** Compact numbers without exponents: at most three decimals, never "-0". */
export function pdfNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const text = value.toFixed(3).replace(/\.?0+$/, '');
  return text === '-0' ? '0' : text;
}

/** A PDF text string: literal for plain ASCII, UTF-16 with a byte-order mark otherwise. */
export function pdfText(value: string): string {
  if (/^[\x20-\x7e]*$/.test(value)) return `(${value.replace(/[\\()]/g, '\\$&')})`;
  let hex = 'FEFF';
  for (let i = 0; i < value.length; i++)
    hex += value.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
  return `<${hex}>`;
}

function pdfDate(date: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  return `D:${date.getUTCFullYear()}${two(date.getUTCMonth() + 1)}${two(date.getUTCDate())}${two(date.getUTCHours())}${two(date.getUTCMinutes())}${two(date.getUTCSeconds())}Z`;
}

class ByteWriter {
  private readonly parts: Uint8Array[] = [];
  private readonly encoder = new TextEncoder();
  length = 0;

  text(value: string) {
    this.bytes(this.encoder.encode(value));
  }

  bytes(value: Uint8Array) {
    this.parts.push(value);
    this.length += value.length;
  }

  result(): Uint8Array {
    const out = new Uint8Array(this.length);
    let offset = 0;
    for (const part of this.parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out;
  }
}

/** Builds a complete PDF file. */
export function createPdf(pages: readonly PdfPage[], info: PdfInfo = {}): Uint8Array {
  const out = new ByteWriter();
  const offsets: number[] = [];
  const object = (id: number, body: string) => {
    offsets[id] = out.length;
    out.text(`${id} 0 obj\n${body}\nendobj\n`);
  };

  out.text('%PDF-1.6\n');
  // A comment with high bytes tells transfer tools the file is binary.
  out.bytes(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  const pageId = (i: number) => 4 + i * 3;
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(
    2,
    `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] /Count ${pages.length} >>`,
  );
  const infoEntries = [
    info.title !== undefined ? `/Title ${pdfText(info.title)}` : '',
    info.creator ? `/Creator ${pdfText(info.creator)}` : '',
    info.producer ? `/Producer ${pdfText(info.producer)}` : '',
    `/CreationDate (${pdfDate(info.created ?? new Date())})`,
  ].filter(Boolean);
  object(3, `<< ${infoEntries.join(' ')} >>`);

  pages.forEach((page, i) => {
    // PDF coordinates are limited to 200 inches. UserUnit preserves the physical
    // size of larger banners while keeping all boxes inside that range (PDF 1.6).
    const unit = Math.max(1, Math.ceil(Math.max(page.width, page.height) / 14_400));
    const n = (points: number) => pdfNumber(points / unit);
    const id = pageId(i);
    const box = (b: PdfBox) =>
      `[${n(b.x)} ${n(page.height - b.y - b.height)} ${n(b.x + b.width)} ${n(page.height - b.y)}]`;
    const boxes = [
      page.trimBox ? `/TrimBox ${box(page.trimBox)}` : '',
      page.bleedBox ? `/BleedBox ${box(page.bleedBox)}` : '',
    ].join(' ');
    object(
      id,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(page.width)} ${n(page.height)}] /UserUnit ${unit} ${boxes} /Resources << /XObject << /Im0 ${id + 2} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${id + 1} 0 R >>`,
    );

    const { imageBox: b } = page;
    let content = `q\n${n(b.width)} 0 0 ${n(b.height)} ${n(b.x)} ${n(page.height - b.y - b.height)} cm\n/Im0 Do\nQ\n`;
    if (page.lines?.length) {
      content += `q\n0 G\n${n(page.lineWidth ?? 0.25)} w\n`;
      for (const line of page.lines)
        content += `${n(line.x1)} ${n(page.height - line.y1)} m ${n(line.x2)} ${n(page.height - line.y2)} l S\n`;
      content += 'Q\n';
    }
    object(id + 1, `<< /Length ${content.length} >>\nstream\n${content}endstream`);

    const { image } = page;
    offsets[id + 2] = out.length;
    out.text(
      `${id + 2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.jpeg.length} >>\nstream\n`,
    );
    out.bytes(image.jpeg);
    out.text('\nendstream\nendobj\n');
  });

  const xref = out.length;
  const count = 4 + pages.length * 3;
  let table = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let id = 1; id < count; id++)
    table += `${String(offsets[id] ?? 0).padStart(10, '0')} 00000 n \n`;
  out.text(
    `${table}trailer\n<< /Size ${count} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`,
  );
  return out.result();
}
