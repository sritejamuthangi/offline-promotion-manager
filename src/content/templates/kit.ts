import type {
  ColorValue,
  Fill,
  GridElement,
  IconElement,
  IconName,
  ImageElement,
  LineElement,
  QrElement,
  Shadow,
  ShapeElement,
  ShapeKind,
  StickerElement,
  StickerName,
  Stroke,
  TextElement,
  TextStyle,
  Theme,
} from '@/core/schema';
import { type FontPairingId, pairingFonts } from '../fontPairings';
import { librarySrc } from '../library';
import { type PaletteId, paletteColors } from '../palettes';

/** A rectangle in CSS px. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Common {
  rotation?: number;
  opacity?: number;
  name?: string;
  /** Content people are expected to replace with their own. */
  placeholder?: boolean;
  locked?: boolean;
}

export interface TextOptions extends Common {
  /** Font size in px. */
  size: number;
  font?: string;
  weight?: number;
  color?: ColorValue;
  align?: TextStyle['align'];
  valign?: TextStyle['verticalAlign'];
  lineHeight?: number;
  /** Letter spacing in em. */
  spacing?: number;
  transform?: TextStyle['textTransform'];
  italic?: boolean;
  underline?: boolean;
  stroke?: Stroke;
  shadow?: Shadow;
}

/** A transparent fill, for outlines without a fill. */
export const NO_FILL = '#00000000';

export function templateTheme(palette: PaletteId, fonts: FontPairingId): Theme {
  return { colors: paletteColors(palette), fonts: pairingFonts(fonts) };
}

export const solidFill = (color: ColorValue): Fill => ({ type: 'solid', color });

/** A built-in library graphic as a page background, redrawn to fit any page shape. */
export const libraryFill = (id: string): Fill => ({
  type: 'image',
  src: librarySrc(id),
  fit: 'cover',
});

/** A soft drop shadow scaled to the page. */
export const softShadow = (size: number): Shadow => ({
  color: '#0000001f',
  blur: size * 2.4,
  offsetX: 0,
  offsetY: size * 0.8,
});

/**
 * Element builders for one page. Positions are in px; `s()` gives a share of the page's
 * shorter side (for type sizes that read the same at A4, US Letter and larger sizes),
 * `x()` and `y()` a share of the width and height.
 */
export function createKit(page: { width: number; height: number }) {
  const W = page.width;
  const H = page.height;
  const short = Math.min(W, H);
  let count = 0;

  const base = (box: Box, o: Common = {}) => ({
    id: `el-${++count}`,
    x: box.x,
    y: box.y,
    width: Math.max(1, box.w),
    height: Math.max(1, box.h),
    rotation: o.rotation ?? 0,
    opacity: o.opacity ?? 1,
    ...(o.name ? { name: o.name } : {}),
    ...(o.placeholder ? { placeholder: true } : {}),
    ...(o.locked ? { locked: true } : {}),
  });

  const fillOf = (fill: Fill | ColorValue): Fill =>
    typeof fill === 'string' ? solidFill(fill) : fill;

  const shape = (
    kind: ShapeKind,
    box: Box,
    fill: Fill | ColorValue,
    o: Common & { radius?: number; stroke?: Stroke; shadow?: Shadow } = {},
  ): ShapeElement => ({
    ...base(box, o),
    type: 'shape',
    shape: kind,
    fill: fillOf(fill),
    ...(o.radius ? { radius: o.radius } : {}),
    ...(o.stroke ? { stroke: o.stroke } : {}),
    ...(o.shadow ? { shadow: o.shadow } : {}),
  });

  const image = (
    src: string,
    box: Box,
    o: Common & {
      fit?: ImageElement['fit'];
      radius?: number;
      alt?: string;
      stroke?: Stroke;
      shadow?: Shadow;
      flipX?: boolean;
      flipY?: boolean;
    } = {},
  ): ImageElement => ({
    ...base(box, o),
    type: 'image',
    src,
    fit: o.fit ?? 'cover',
    ...(o.alt !== undefined ? { alt: o.alt } : {}),
    ...(o.radius ? { radius: o.radius } : {}),
    ...(o.stroke ? { stroke: o.stroke } : {}),
    ...(o.shadow ? { shadow: o.shadow } : {}),
    ...(o.flipX ? { flipX: true } : {}),
    ...(o.flipY ? { flipY: true } : {}),
  });

  return {
    W,
    H,
    /** `percent` of the shorter page side, in px. */
    s: (percent: number) => (short * percent) / 100,
    /** `percent` of the page width, in px. */
    x: (percent: number) => (W * percent) / 100,
    /** `percent` of the page height, in px. */
    y: (percent: number) => (H * percent) / 100,
    /** A box from percentages of the page width (left, width) and height (top, height). */
    box: (left: number, top: number, width: number, height: number): Box => ({
      x: (W * left) / 100,
      y: (H * top) / 100,
      w: (W * width) / 100,
      h: (H * height) / 100,
    }),

    text(text: string, box: Box, o: TextOptions): TextElement {
      return {
        ...base(box, o),
        type: 'text',
        text,
        direction: 'auto',
        style: {
          fontFamily: o.font ?? '$body',
          fontSize: o.size,
          fontWeight: o.weight ?? 400,
          color: o.color ?? '$text',
          align: o.align ?? 'center',
          verticalAlign: o.valign ?? 'middle',
          lineHeight: o.lineHeight ?? 1.25,
          letterSpacing: o.spacing ?? 0,
          ...(o.transform && o.transform !== 'none' ? { textTransform: o.transform } : {}),
          ...(o.italic ? { italic: true } : {}),
          ...(o.underline ? { underline: true } : {}),
          ...(o.stroke ? { stroke: o.stroke } : {}),
          ...(o.shadow ? { shadow: o.shadow } : {}),
        },
      };
    },

    shape,
    rect: (
      box: Box,
      fill: Fill | ColorValue,
      o?: Common & { radius?: number; stroke?: Stroke; shadow?: Shadow },
    ) => shape('rect', box, fill, o),
    ellipse: (
      box: Box,
      fill: Fill | ColorValue,
      o?: Common & { stroke?: Stroke; shadow?: Shadow },
    ) => shape('ellipse', box, fill, o),

    /** A horizontal line; `box.h` is its thickness. Rotate it for other directions. */
    line(
      box: Box,
      color: ColorValue,
      o: Common & { dash?: Stroke['dash']; caps?: LineElement['startCap'] } = {},
    ): LineElement {
      return {
        ...base(box, o),
        type: 'line',
        stroke: { color, width: Math.max(0.5, box.h), ...(o.dash ? { dash: o.dash } : {}) },
        startCap: o.caps ?? 'none',
        endCap: o.caps ?? 'none',
      };
    },

    image,
    /** A built-in library graphic as an image element (decorative unless `alt` is given). */
    graphic: (id: string, box: Box, o: Parameters<typeof image>[2] = {}) =>
      image(librarySrc(id), box, { alt: '', ...o }),

    qr(
      value: string,
      box: Box,
      o: Common & { ecLevel?: QrElement['ecLevel']; margin?: number } = {},
    ): QrElement {
      // QR codes stay black on white whatever the palette: it scans most reliably.
      return {
        ...base(box, o),
        type: 'qr',
        value,
        ecLevel: o.ecLevel ?? 'M',
        foreground: '#000000',
        background: '#ffffff',
        margin: o.margin ?? 2,
      };
    },

    icon(
      name: IconName,
      box: Box,
      color: ColorValue,
      o: Common & { strokeWidth?: number } = {},
    ): IconElement {
      return { ...base(box, o), type: 'icon', icon: name, color, strokeWidth: o.strokeWidth ?? 2 };
    },

    sticker(
      name: StickerName,
      box: Box,
      fill: Fill | ColorValue,
      o: Common & { stroke?: Stroke; shadow?: Shadow } = {},
    ): StickerElement {
      return {
        ...base(box, o),
        type: 'sticker',
        sticker: name,
        fill: fillOf(fill),
        ...(o.stroke ? { stroke: o.stroke } : {}),
        ...(o.shadow ? { shadow: o.shadow } : {}),
      };
    },

    grid(
      items: readonly (readonly [name: string, subtitle?: string])[],
      box: Box,
      o: Common &
        Pick<
          GridElement,
          | 'gap'
          | 'padding'
          | 'cardPadding'
          | 'cardRadius'
          | 'logoHeight'
          | 'nameStyle'
          | 'subtitleStyle'
        > &
        Partial<Pick<GridElement, 'columns' | 'cardFill' | 'cardStroke' | 'shadow'>>,
    ): GridElement {
      return {
        ...base(box, o),
        type: 'grid',
        items: items.map(([name, subtitle], index) => ({
          id: `item-${count}-${index}`,
          name,
          ...(subtitle ? { subtitle } : {}),
        })),
        gap: o.gap,
        padding: o.padding,
        cardPadding: o.cardPadding,
        cardRadius: o.cardRadius,
        logoHeight: o.logoHeight,
        nameStyle: o.nameStyle,
        subtitleStyle: o.subtitleStyle,
        cardFill: o.cardFill ?? solidFill('$surface'),
        ...(o.columns ? { columns: o.columns } : {}),
        ...(o.cardStroke ? { cardStroke: o.cardStroke } : {}),
        ...(o.shadow ? { shadow: o.shadow } : {}),
      };
    },
  };
}

export type Kit = ReturnType<typeof createKit>;
