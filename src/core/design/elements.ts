import { newId } from '../ids';
import type {
  Design,
  DesignElement,
  GridElement,
  GridItem,
  IconElement,
  IconName,
  ImageElement,
  QrElement,
  QrErrorLevel,
  ShapeKind,
  StickerElement,
  StickerName,
} from '../schema';

export type InsertKind = 'text' | 'line' | ShapeKind;

/** Sensible initial sizes, relative to the paper, even on tiny labels or large posters. */
export function createElement(kind: InsertKind, design: Design, text: string): DesignElement {
  const size = Math.min(design.width, design.height);
  const width = Math.max(1, size * (kind === 'text' ? 0.65 : 0.32));
  const height = Math.max(
    1,
    kind === 'line' ? size * 0.006 : kind === 'text' ? size * 0.14 : size * 0.25,
  );
  const base = {
    id: newId(),
    x: (design.width - width) / 2,
    y: (design.height - height) / 2,
    width,
    height,
    rotation: 0,
    opacity: 1,
  };
  if (kind === 'text')
    return {
      ...base,
      type: 'text',
      text,
      direction: 'auto',
      style: {
        fontFamily: '$heading',
        fontSize: size * 0.06,
        fontWeight: 700,
        color: '$text',
        align: 'center',
        verticalAlign: 'middle',
        lineHeight: 1.2,
        letterSpacing: 0,
      },
    };
  if (kind === 'line')
    return {
      ...base,
      type: 'line',
      stroke: { color: '$primary', width: height },
      startCap: 'none',
      endCap: 'none',
    };
  return { ...base, type: 'shape', shape: kind, fill: { type: 'solid', color: '$primary' } };
}

function centered(design: Design, width: number, height: number) {
  return {
    id: newId(),
    x: (design.width - width) / 2,
    y: (design.height - height) / 2,
    width,
    height,
    rotation: 0,
    opacity: 1,
  };
}

/** A newly uploaded image, fitted inside the page without changing its aspect ratio. */
export function createImageElement(
  design: Design,
  input: { src: string; width?: number; height?: number; alt?: string },
): ImageElement {
  const naturalWidth = input.width && input.width > 0 ? input.width : 1;
  const naturalHeight = input.height && input.height > 0 ? input.height : 1;
  const scale = Math.min(
    (design.width * 0.65) / naturalWidth,
    (design.height * 0.65) / naturalHeight,
  );
  const width = Math.max(1, naturalWidth * scale);
  const height = Math.max(1, naturalHeight * scale);
  return {
    ...centered(design, width, height),
    type: 'image',
    src: input.src,
    alt: input.alt,
    fit: 'cover',
  };
}

export function createQrElement(
  design: Design,
  value: string,
  ecLevel: QrErrorLevel = 'M',
): QrElement {
  const size = Math.min(design.width, design.height) * 0.28;
  return {
    ...centered(design, size, size),
    type: 'qr',
    value,
    ecLevel,
    foreground: '#18181b',
    background: '#ffffff',
    margin: 2,
  };
}

export function createIconElement(design: Design, icon: IconName): IconElement {
  const size = Math.min(design.width, design.height) * 0.12;
  return {
    ...centered(design, size, size),
    type: 'icon',
    icon,
    color: '$text',
    strokeWidth: 2,
  };
}

export function createStickerElement(design: Design, sticker: StickerName): StickerElement {
  const size = Math.min(design.width, design.height) * 0.18;
  return {
    ...centered(design, size, size),
    type: 'sticker',
    sticker,
    fill: { type: 'solid', color: '$primary' },
    stroke: { color: '#ffffff', width: Math.max(0.5, size * 0.02) },
    shadow: {
      color: '#00000026',
      blur: Math.max(1, size * 0.04),
      offsetX: 0,
      offsetY: Math.max(1, size * 0.02),
    },
  };
}

export function createGridItem(name: string, subtitle?: string): GridItem {
  return { id: newId(), name, subtitle };
}

export function createGridElement(design: Design, items: GridItem[]): GridElement {
  const size = Math.min(design.width, design.height);
  const width = design.width * 0.84;
  const height = design.height * 0.5;
  return {
    ...centered(design, width, height),
    type: 'grid',
    items,
    gap: size * 0.02,
    padding: size * 0.03,
    cardPadding: size * 0.025,
    cardFill: { type: 'solid', color: '$surface' },
    cardRadius: size * 0.015,
    logoHeight: size * 0.08,
    nameStyle: {
      fontFamily: '$heading',
      fontSize: Math.max(8, size * 0.022),
      fontWeight: 600,
      color: '$text',
    },
    subtitleStyle: {
      fontFamily: '$body',
      fontSize: Math.max(7, size * 0.016),
      fontWeight: 400,
      color: '$muted',
    },
    shadow: {
      color: '#00000014',
      blur: Math.max(1, size * 0.02),
      offsetX: 0,
      offsetY: Math.max(1, size * 0.005),
    },
  };
}
