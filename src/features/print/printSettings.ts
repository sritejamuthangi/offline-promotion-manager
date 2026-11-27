import type { PaperFamily } from '@/core/locale';
import { getPreset, type PresetId, presetSizePx, SIZE_PRESETS } from '@/core/paper';
import {
  designSheet,
  orientationOf,
  type PrintLayout,
  type PrintOptions,
  type PrintPlan,
  planPrint,
  type SheetOrientation,
  type Size,
  suggestPrintLayout,
} from '@/core/print';
import type { Design } from '@/core/schema';
import { toPx, type Unit } from '@/core/units';

export type PaperChoice = 'design' | 'custom' | PresetId;

/** Paper and poster sizes offered for printing. */
export const PRINT_PAPERS = SIZE_PRESETS.filter(
  (preset) => preset.category === 'paper' || preset.category === 'poster',
);

export interface PrintSettings {
  layout: PrintLayout;
  paper: PaperChoice;
  /** Custom paper size, px. */
  custom: Size;
  orientation: SheetOrientation;
  fitToPaper: boolean;
  /** Copies of each page; `null` fills one sheet. */
  copies: number | null;
  gap: number;
  posterPercent: number;
  overlap: number;
  marks: boolean;
  bleed: number;
  safeMargins: boolean;
  allPages: boolean;
}

export type DownloadFormat = 'png' | 'jpeg' | 'pdf';

export interface DownloadSettings {
  format: DownloadFormat;
  dpi: number;
  allPages: boolean;
  marks: boolean;
  bleed: number;
}

/** The usual bleed: 3 mm, or ⅛ inch where inches are used. */
export function standardBleed(unit: Unit): number {
  return unit === 'in' ? toPx(0.125, 'in') : toPx(3, 'mm');
}

export function standardPaper(family: PaperFamily): PresetId {
  return family === 'letter' ? 'letter' : 'a4';
}

/** Units for print lengths: the person's unit, or the regional one for screen units. */
export function printUnit(unit: Unit, family: PaperFamily): Unit {
  if (unit === 'mm' || unit === 'cm' || unit === 'in') return unit;
  return family === 'letter' ? 'in' : 'mm';
}

export function initialPrintSettings(design: Design, family: PaperFamily): PrintSettings {
  const paper = standardPaper(family);
  const preset = getPreset(paper);
  const size = preset ? presetSizePx(preset) : { width: design.width, height: design.height };
  return {
    ...suggestPrintLayout(design, size),
    paper,
    custom: size,
    orientation: 'auto',
    copies: null,
    gap: 0,
    posterPercent: 100,
    overlap: family === 'letter' ? toPx(0.375, 'in') : toPx(10, 'mm'),
    bleed: design.bleed,
    safeMargins: true,
    allPages: true,
  };
}

export function initialDownloadSettings(design: Design): DownloadSettings {
  const screen = design.unit === 'px';
  return {
    format: screen ? 'png' : 'pdf',
    dpi: screen ? 96 : 300,
    allPages: true,
    marks: false,
    bleed: design.bleed > 0 ? design.bleed : standardBleed(design.unit),
  };
}

export function paperSize(settings: PrintSettings, design: Design): Size {
  if (settings.paper === 'design') return designSheet(design, settings.marks, settings.bleed);
  if (settings.paper === 'custom') return settings.custom;
  const preset = getPreset(settings.paper);
  return preset ? presetSizePx(preset) : settings.custom;
}

function printOptions(settings: PrintSettings, design: Design, copies: number): PrintOptions {
  const designPaper = settings.paper === 'design';
  return {
    layout: settings.layout,
    paper: paperSize(settings, design),
    orientation: designPaper ? 'auto' : settings.orientation,
    fitToPaper: settings.layout === 'single' && !designPaper && settings.fitToPaper,
    copies,
    gap: settings.gap,
    posterScale: settings.posterPercent / 100,
    overlap: settings.overlap,
    marks: settings.marks,
    bleed: settings.layout === 'poster' ? 0 : settings.bleed,
    ...(settings.safeMargins ? {} : { margin: 0 }),
  };
}

/** The print job for these settings. "Fill the sheet" prints as many copies as fit. */
export function planForSettings(
  settings: PrintSettings,
  design: Design,
  pages: readonly number[],
): PrintPlan {
  const plan = planPrint(design, pages, printOptions(settings, design, settings.copies ?? 1));
  if (settings.layout !== 'multiple' || settings.copies !== null || plan.perSheet <= 1) return plan;
  return planPrint(design, pages, printOptions(settings, design, plan.perSheet));
}

/** A download shown as a sheet: the page itself, with room for crop marks in PDFs. */
export function downloadPlan(
  design: Design,
  pages: readonly number[],
  settings: DownloadSettings,
): PrintPlan {
  const marks = settings.format === 'pdf' && settings.marks;
  const bleed = marks ? settings.bleed : 0;
  const paper = designSheet(design, marks, bleed);
  return planPrint(design, pages, {
    layout: 'single',
    paper,
    orientation: orientationOf(paper),
    fitToPaper: false,
    copies: 1,
    gap: 0,
    posterScale: 1,
    overlap: 0,
    marks,
    bleed,
    margin: 0,
  });
}

export interface ResolutionChoice {
  dpi: number;
  /** Screen designs: a multiple of their pixel size. */
  scale?: number;
  use?: 'screen' | 'standard' | 'high';
}

/** Resolutions worth offering: print resolutions, or pixel multiples for screen designs. */
export function resolutionChoices(design: Design): ResolutionChoice[] {
  if (design.unit === 'px') return [1, 2, 3].map((scale) => ({ dpi: 96 * scale, scale }));
  return [
    { dpi: 72, use: 'screen' },
    { dpi: 150, use: 'standard' },
    { dpi: 300, use: 'high' },
  ];
}
