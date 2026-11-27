import { ChevronLeft, ChevronRight, Download, LoaderCircle, Printer } from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getPreset, presetSizePx } from '@/core/paper';
import {
  imageSources,
  MAX_COPIES,
  MAX_SHEETS,
  type PrintLayout,
  type PrintPlan,
  rasterSize,
  tileName,
} from '@/core/print';
import { type Design, MAX_DESIGN_PX } from '@/core/schema';
import { formatSize, fromPx, roundTo, toPx, UNIT_DECIMALS, type Unit } from '@/core/units';
import { useEffectivePaper, useEffectiveUnit } from '@/features/settings/settingsStore';
import { useElementSize } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { preloadAssets } from '@/render/assetUrl';
import { loadScriptFonts } from '@/styles/loadScriptFonts';
import {
  downloadBlob,
  exportFileName,
  exportImage,
  exportPdf,
  maxExportPixels,
  prepareExportFonts,
} from './exportFiles';
import { PrintJob, type PrintJobData } from './PrintJob';
import { PrintSheetView } from './PrintSheetView';
import {
  type DownloadFormat,
  type DownloadSettings,
  downloadPlan,
  initialDownloadSettings,
  initialPrintSettings,
  type PaperChoice,
  PRINT_PAPERS,
  type PrintSettings,
  planForSettings,
  printUnit,
  resolutionChoices,
  standardPaper,
} from './printSettings';

export type PrintTab = 'print' | 'download';

const LAYOUTS: readonly PrintLayout[] = ['single', 'multiple', 'poster'];
const FORMATS: readonly { value: DownloadFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPG' },
  { value: 'pdf', label: 'PDF' },
];

/**
 * Print and download, for the open design. Settings last for the editing session; the
 * dialog stays mounted while closed so it remembers them.
 */
export function PrintDialog({
  design,
  pageIndex,
  tab,
  onTabChange,
  onClose,
}: {
  /** The design as it was when the dialog opened. */
  design: Design;
  pageIndex: number;
  /** The open tab, or null while the dialog is closed. */
  tab: PrintTab | null;
  onTabChange: (tab: PrintTab) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const family = useEffectivePaper();
  const unit = printUnit(useEffectiveUnit(), family);
  const [printSettings, setPrintSettings] = useState(() => initialPrintSettings(design, family));
  const [downloadSettings, setDownloadSettings] = useState(() => initialDownloadSettings(design));
  /** Sheets ready to print; kept until the dialog closes or another print starts. */
  const [job, setJob] = useState<PrintJobData | null>(null);
  /** The browser's print window is open (or about to open). */
  const [printing, setPrinting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preparingFonts, setPreparingFonts] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const printRequest = useRef(0);
  useEffect(
    () => () => {
      printRequest.current++;
    },
    [],
  );
  const pageCount = design.pages.length;
  const pagesFor = (all: boolean) =>
    all ? design.pages.map((_, index) => index) : [Math.min(pageIndex, pageCount - 1)];

  useEffect(() => {
    if (tab !== 'download') return;
    let active = true;
    setPreparingFonts(true);
    const pages = downloadSettings.allPages
      ? design.pages.map((_, index) => index)
      : [Math.min(pageIndex, design.pages.length - 1)];
    void prepareExportFonts(design, pages)
      .catch(() => undefined) // The Download action retries and reports any failure.
      .finally(() => {
        if (active) setPreparingFonts(false);
      });
    return () => {
      active = false;
      setPreparingFonts(false);
    };
  }, [design, tab, pageIndex, downloadSettings.allPages]);

  const print = async (data: PrintJobData) => {
    if (!data.plan.fits || data.plan.limited || !data.plan.sheets.length || preparing || printing)
      return;
    const request = ++printRequest.current;
    setPreparing(true);
    try {
      const pages = [
        ...new Set(data.plan.sheets.flatMap((sheet) => sheet.placements.map((p) => p.pageIndex))),
      ];
      await Promise.all([
        preloadAssets(imageSources(data.design, pages)),
        // Without them, the device's fonts draw other writing systems.
        loadScriptFonts().catch(() => undefined),
      ]);
      if (request === printRequest.current) {
        setJob(data);
        setPrinting(true);
      }
    } catch (error) {
      console.error('Could not prepare printing', error);
      toast.error(t('print.printFailed'));
    } finally {
      if (request === printRequest.current) setPreparing(false);
    }
  };

  const download = async () => {
    setBusy(true);
    try {
      const pages = pagesFor(downloadSettings.allPages);
      const { format, dpi, marks, bleed } = downloadSettings;
      if (format === 'pdf') {
        const name = exportFileName(design.name, 'pdf');
        downloadBlob(await exportPdf(design, pages, { dpi, marks, bleed }), name);
        toast.success(t('print.downloaded', { name }));
      } else {
        const extension = format === 'png' ? 'png' : 'jpg';
        let name = '';
        for (const page of pages) {
          name = exportFileName(design.name, extension, pages.length > 1 ? page + 1 : undefined);
          downloadBlob(await exportImage(design, page, format, dpi), name);
        }
        toast.success(
          pages.length > 1
            ? t('print.downloadedFiles', { count: pages.length })
            : t('print.downloaded', { name }),
        );
      }
    } catch (error) {
      console.error('Export failed', error);
      toast.error(t('print.exportFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog
        open={tab !== null}
        onOpenChange={(open) => {
          if (open) return;
          // Closing removes the prepared sheets, also for browsers that never report the
          // end of printing, and cancels a print still loading its images.
          printRequest.current++;
          setPreparing(false);
          setPrinting(false);
          setJob(null);
          onClose();
        }}
      >
        <DialogContent
          className="flex max-h-[min(94dvh,900px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
              event.preventDefault();
              onTabChange('print');
            }
          }}
        >
          <DialogHeader className="border-b p-5 pe-12">
            <DialogTitle>{t('print.title')}</DialogTitle>
            <DialogDescription>{t('print.description')}</DialogDescription>
          </DialogHeader>
          <Tabs
            value={tab ?? 'print'}
            onValueChange={(value) => onTabChange(value as PrintTab)}
            className="min-h-0 flex-1"
          >
            <div className="border-b px-5 py-3">
              <TabsList aria-label={t('print.tabs')}>
                <TabsTrigger value="print">
                  <Printer aria-hidden="true" />
                  {t('print.print')}
                </TabsTrigger>
                <TabsTrigger value="download">
                  <Download aria-hidden="true" />
                  {t('print.download')}
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="print" className="flex min-h-0 flex-1 flex-col">
              <PrintPanel
                design={design}
                pages={pagesFor(printSettings.allPages)}
                settings={printSettings}
                onChange={setPrintSettings}
                unit={unit}
                standard={standardPaper(family)}
                onPrint={(data) => void print(data)}
                printing={preparing || printing}
              />
            </TabsContent>
            <TabsContent value="download" className="flex min-h-0 flex-1 flex-col">
              <DownloadPanel
                design={design}
                pageIndex={Math.min(pageIndex, pageCount - 1)}
                settings={downloadSettings}
                onChange={setDownloadSettings}
                unit={unit}
                busy={busy || preparingFonts}
                onDownload={() => void download()}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      <PrintJob
        job={job}
        onPrinted={() => setPrinting(false)}
        onError={() => {
          setJob(null);
          setPrinting(false);
          toast.error(t('print.printFailed'));
        }}
      />
    </>
  );
}

function PrintPanel({
  design,
  pages,
  settings,
  onChange,
  unit,
  standard,
  onPrint,
  printing,
}: {
  design: Design;
  pages: number[];
  settings: PrintSettings;
  onChange: (settings: PrintSettings) => void;
  unit: Unit;
  standard: PaperChoice;
  onPrint: (job: PrintJobData) => void;
  printing: boolean;
}) {
  const { t, i18n } = useTranslation();
  const pageKey = pages.join(',');
  // biome-ignore lint/correctness/useExhaustiveDependencies: `pageKey` stands for `pages`.
  const plan = useMemo(() => planForSettings(settings, design, pages), [settings, design, pageKey]);
  const labels = useMemo(
    () =>
      plan.sheets.map((sheet) =>
        sheet.tile && settings.marks && settings.safeMargins
          ? t('print.tileLabel', {
              tile: tileName(sheet.tile.row, sheet.tile.column),
              row: sheet.tile.row + 1,
              rows: plan.grid.rows,
              column: sheet.tile.column + 1,
              columns: plan.grid.columns,
            })
          : undefined,
      ),
    [plan, settings.marks, settings.safeMargins, t],
  );
  const set = (patch: Partial<PrintSettings>) => onChange({ ...settings, ...patch });
  const lang = i18n.language;
  const designPaper = settings.paper === 'design';
  const { layout } = settings;

  const sheets = t('print.sheets', { count: plan.sheets.length });
  const summary =
    layout === 'multiple'
      ? `${t('print.perSheet', { count: plan.perSheet })} · ${sheets}`
      : layout === 'poster'
        ? [
            t('print.posterSummary', {
              size: formatSize(plan.printedSize.width, plan.printedSize.height, unit, lang),
              columns: plan.grid.columns,
              rows: plan.grid.rows,
            }),
            // Several pages (or a cut-short job) print a different number of sheets.
            ...(plan.sheets.length === plan.perSheet ? [] : [sheets]),
          ].join(' · ')
        : `${
            Math.abs(plan.scale - 1) < 0.005
              ? t('print.actualSummary')
              : t('print.scaledSummary', { percent: Math.round(plan.scale * 100) })
          } · ${sheets}`;
  const preset = !designPaper && settings.paper !== 'custom' ? getPreset(settings.paper) : null;
  const paperName = preset
    ? t(`presets.${preset.id}`)
    : formatSize(settings.custom.width, settings.custom.height, unit, lang);
  const notes: { warning?: boolean; text: string }[] = [];
  if (!plan.fits)
    notes.push({
      warning: true,
      text: t(layout === 'multiple' ? 'print.nothingFits' : 'print.doesNotFit'),
    });
  if (plan.limited) notes.push({ warning: true, text: t('print.limited', { count: MAX_SHEETS }) });
  if (plan.fits && layout === 'single' && !settings.fitToPaper && !designPaper && plan.edgeToEdge)
    notes.push({ text: t('print.edgeHint') });
  notes.push({
    text: designPaper ? t('print.printDesignHint') : t('print.printHint', { paper: paperName }),
  });

  return (
    <>
      <div className="grid min-h-0 flex-1 content-start gap-6 overflow-y-auto p-5 md:grid-cols-2">
        <div className="md:order-2">
          <SheetPreview design={design} plan={plan} labels={labels} />
        </div>
        <div className="grid content-start gap-5 md:order-1">
          <Choice
            label={t('print.layout')}
            hint={t(`print.layoutHints.${layout}`)}
            value={layout}
            options={LAYOUTS.map((value) => ({ value, label: t(`print.layouts.${value}`) }))}
            onChange={(next) =>
              set({
                layout: next,
                paper: next !== 'single' && designPaper ? standard : settings.paper,
                marks: next === 'single' ? settings.marks : true,
              })
            }
          />
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9.5rem]">
            <SelectField
              label={t('print.paper')}
              value={settings.paper}
              onChange={(paper) => set({ paper: paper as PaperChoice })}
            >
              {layout === 'single' && (
                <option value="design">
                  {t('print.paperDesign', {
                    size: formatSize(design.width, design.height, unit, lang),
                  })}
                </option>
              )}
              {PRINT_PAPERS.map((paper) => {
                const size = presetSizePx(paper);
                return (
                  <option key={paper.id} value={paper.id}>
                    {`${t(`presets.${paper.id}`)} · ${formatSize(size.width, size.height, paper.unit, lang)}`}
                  </option>
                );
              })}
              <option value="custom">{t('print.paperCustom')}</option>
            </SelectField>
            {!designPaper && (
              <SelectField
                label={t('print.orientation')}
                value={settings.orientation}
                onChange={(orientation) =>
                  set({ orientation: orientation as PrintSettings['orientation'] })
                }
              >
                {(['auto', 'portrait', 'landscape'] as const).map((value) => (
                  <option key={value} value={value}>
                    {t(`print.orientations.${value}`)}
                  </option>
                ))}
              </SelectField>
            )}
          </div>
          {settings.paper === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <LengthField
                label={t('print.width')}
                value={settings.custom.width}
                unit={unit}
                min={toPx(10, 'mm')}
                max={MAX_DESIGN_PX}
                onChange={(width) => set({ custom: { ...settings.custom, width } })}
              />
              <LengthField
                label={t('print.height')}
                value={settings.custom.height}
                unit={unit}
                min={toPx(10, 'mm')}
                max={MAX_DESIGN_PX}
                onChange={(height) => set({ custom: { ...settings.custom, height } })}
              />
            </div>
          )}

          {layout === 'single' && !designPaper && (
            <Choice
              label={t('print.sizeOnPaper')}
              value={settings.fitToPaper ? 'fit' : 'actual'}
              options={[
                { value: 'actual', label: t('print.actualSize') },
                { value: 'fit', label: t('print.fitToPaper') },
              ]}
              onChange={(value) => set({ fitToPaper: value === 'fit' })}
            />
          )}
          {layout === 'multiple' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid content-start gap-1.5">
                <CountField
                  label={t('print.copies')}
                  value={settings.copies ?? Math.max(1, plan.perSheet)}
                  min={1}
                  max={MAX_COPIES}
                  onChange={(copies) => set({ copies })}
                />
                {settings.copies !== null && (
                  <Button
                    size="sm"
                    variant="link"
                    className="h-auto justify-start px-0"
                    onClick={() => set({ copies: null })}
                  >
                    {t('print.fillSheet')}
                  </Button>
                )}
              </div>
              <LengthField
                label={t('print.gap')}
                value={settings.gap}
                unit={unit}
                min={0}
                max={toPx(50, 'mm')}
                onChange={(gap) => set({ gap })}
              />
            </div>
          )}
          {layout === 'poster' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <CountField
                label={t('print.posterScale')}
                suffix="%"
                hint={t('print.posterScaleHint', {
                  size: formatSize(plan.printedSize.width, plan.printedSize.height, unit, lang),
                })}
                value={settings.posterPercent}
                min={10}
                max={1000}
                onChange={(posterPercent) => set({ posterPercent })}
              />
              <LengthField
                label={t('print.overlap')}
                hint={t('print.overlapHint')}
                value={settings.overlap}
                unit={unit}
                min={0}
                max={toPx(50, 'mm')}
                onChange={(overlap) => set({ overlap })}
              />
            </div>
          )}

          <CheckField
            label={t(layout === 'poster' ? 'print.posterMarks' : 'print.marks')}
            hint={t(layout === 'poster' ? 'print.posterMarksHint' : 'print.marksHint')}
            checked={settings.marks}
            onChange={(marks) => set({ marks })}
          />
          {settings.marks && layout !== 'poster' && (
            <LengthField
              label={t('print.bleed')}
              hint={t('print.bleedHint')}
              value={settings.bleed}
              unit={unit}
              min={0}
              max={toPx(25, 'mm')}
              onChange={(bleed) => set({ bleed })}
            />
          )}
          {(layout !== 'single' || (settings.fitToPaper && !designPaper)) && (
            <CheckField
              label={t('print.safeMargins')}
              hint={t('print.safeMarginsHint')}
              checked={settings.safeMargins}
              onChange={(safeMargins) => set({ safeMargins })}
            />
          )}
          {design.pages.length > 1 && (
            <Choice
              label={t('print.pages')}
              value={settings.allPages ? 'all' : 'current'}
              options={[
                { value: 'all', label: t('print.allPages') },
                { value: 'current', label: t('print.currentPage') },
              ]}
              onChange={(value) => set({ allPages: value === 'all' })}
            />
          )}
        </div>
      </div>
      <footer className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div className="grid min-w-0 gap-1 text-sm">
          <p className="font-medium" aria-live="polite" data-testid="print-summary">
            {summary}
          </p>
          {notes.map((note) => (
            <p
              key={note.text}
              className={cn('text-xs', note.warning ? 'text-destructive' : 'text-muted-foreground')}
            >
              {note.text}
            </p>
          ))}
        </div>
        <Button
          className="shrink-0"
          disabled={!plan.fits || plan.limited || !plan.sheets.length || printing}
          onClick={() => onPrint({ design, plan, labels })}
        >
          <Printer aria-hidden="true" />
          {t('print.print')}
        </Button>
      </footer>
    </>
  );
}

function DownloadPanel({
  design,
  pageIndex,
  settings,
  onChange,
  unit,
  busy,
  onDownload,
}: {
  design: Design;
  pageIndex: number;
  settings: DownloadSettings;
  onChange: (settings: DownloadSettings) => void;
  unit: Unit;
  busy: boolean;
  onDownload: () => void;
}) {
  const { t } = useTranslation();
  const plan = useMemo(
    () =>
      downloadPlan(
        design,
        settings.allPages ? design.pages.map((_, index) => index) : [pageIndex],
        settings,
      ),
    [design, pageIndex, settings],
  );
  const set = (patch: Partial<DownloadSettings>) => onChange({ ...settings, ...patch });
  const limit = maxExportPixels();
  const exportSize = {
    width: design.width + 2 * plan.bleed,
    height: design.height + 2 * plan.bleed,
  };
  const size = rasterSize(exportSize, settings.dpi, limit);
  const files = settings.allPages ? design.pages.length : 1;
  const pdf = settings.format === 'pdf';

  return (
    <>
      <div className="grid min-h-0 flex-1 content-start gap-6 overflow-y-auto p-5 md:grid-cols-2">
        <div className="md:order-2">
          <SheetPreview design={design} plan={plan} />
        </div>
        <div className="grid content-start gap-5 md:order-1">
          <Choice
            label={t('print.format')}
            hint={t(`print.formatHints.${settings.format}`)}
            value={settings.format}
            options={FORMATS}
            onChange={(format) => set({ format })}
          />
          <SelectField
            label={t('print.resolution')}
            value={String(settings.dpi)}
            onChange={(dpi) => set({ dpi: Number(dpi) })}
          >
            {resolutionChoices(design).map((choice) => {
              const pixels = rasterSize(exportSize, choice.dpi, limit);
              return (
                <option key={choice.dpi} value={choice.dpi}>
                  {choice.scale
                    ? t('print.scaleOption', {
                        scale: choice.scale,
                        width: pixels.width,
                        height: pixels.height,
                      })
                    : t('print.dpiOption', {
                        dpi: choice.dpi,
                        use: t(`print.dpiUses.${choice.use ?? 'high'}`),
                        width: pixels.width,
                        height: pixels.height,
                      })}
                </option>
              );
            })}
          </SelectField>
          {size.reduced && (
            <p className="-mt-3 text-muted-foreground text-xs">
              {t('print.reduced', { dpi: Math.round(size.dpi) })}
            </p>
          )}
          {pdf && (
            <CheckField
              label={t('print.pdfMarks')}
              hint={t('print.pdfMarksHint')}
              checked={settings.marks}
              onChange={(marks) => set({ marks })}
            />
          )}
          {pdf && settings.marks && (
            <LengthField
              label={t('print.bleed')}
              hint={t('print.bleedHint')}
              value={settings.bleed}
              unit={unit}
              min={0}
              max={toPx(25, 'mm')}
              onChange={(bleed) => set({ bleed })}
            />
          )}
          {design.pages.length > 1 && (
            <Choice
              label={t('print.pages')}
              value={settings.allPages ? 'all' : 'current'}
              options={[
                { value: 'all', label: t('print.allPages') },
                { value: 'current', label: t('print.currentPage') },
              ]}
              onChange={(value) => set({ allPages: value === 'all' })}
            />
          )}
        </div>
      </div>
      <footer className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div className="grid min-w-0 gap-1 text-sm">
          <p className="font-medium" data-testid="download-summary">
            {`${size.width} × ${size.height} px · ${Math.round(size.dpi)} DPI`}
          </p>
          {pdf ? (
            <p className="text-muted-foreground text-xs">{t('print.pdfNote')}</p>
          ) : (
            files > 1 && (
              <p className="text-muted-foreground text-xs">{t('print.files', { count: files })}</p>
            )
          )}
          {plan.limited && (
            <p className="text-destructive text-xs">{t('print.limited', { count: MAX_SHEETS })}</p>
          )}
        </div>
        <Button className="shrink-0" disabled={busy || plan.limited} onClick={onDownload}>
          {busy ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Download aria-hidden="true" />
          )}
          {busy ? t('print.preparing') : t('print.download')}
        </Button>
      </footer>
    </>
  );
}

/** The real sheet output, scaled to fit, with buttons to step through the sheets. */
function SheetPreview({
  design,
  plan,
  labels,
}: {
  design: Design;
  plan: PrintPlan;
  labels?: readonly (string | undefined)[];
}) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const box = useElementSize(ref);
  const count = plan.sheets.length;
  const current = Math.min(index, Math.max(0, count - 1));
  const sheet = plan.sheets[current];
  const { width, height } = plan.sheet;
  const pad = 16;
  const scale = Math.max(
    0,
    Math.min((box.width - 2 * pad) / width, (box.height - 2 * pad) / height),
  );
  return (
    <div className="grid gap-2 md:sticky md:top-0">
      <div
        ref={ref}
        role="img"
        aria-label={t('print.preview')}
        data-testid="print-preview"
        className="relative h-56 w-full overflow-hidden rounded-xl bg-canvas sm:h-72 md:h-96"
      >
        {sheet && scale > 0 && (
          <div
            className="absolute shadow-md ring-1 ring-black/10"
            style={{
              left: (box.width - width * scale) / 2,
              top: (box.height - height * scale) / 2,
              width: width * scale,
              height: height * scale,
            }}
          >
            <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
              <PrintSheetView
                design={design}
                plan={plan}
                sheet={sheet}
                label={labels?.[current]}
                preview
              />
            </div>
          </div>
        )}
      </div>
      {count > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t('print.previousSheet')}
            disabled={current === 0}
            onClick={() => setIndex(current - 1)}
          >
            <ChevronLeft className="rtl:rotate-180" />
          </Button>
          <span className="min-w-28 text-center text-muted-foreground tabular-nums">
            {t('print.sheetOf', { number: current + 1, count })}
          </span>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t('print.nextSheet')}
            disabled={current >= count - 1}
            onClick={() => setIndex(current + 1)}
          >
            <ChevronRight className="rtl:rotate-180" />
          </Button>
        </div>
      )}
    </div>
  );
}

function Choice<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: readonly { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <span id={id} className="font-medium text-sm leading-none">
        {label}
      </span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next as T)}
        aria-labelledby={id}
        className="grid w-full auto-cols-fr grid-flow-col"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className="h-auto min-h-8 whitespace-normal px-2 py-1.5 text-center leading-tight"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </NativeSelect>
    </div>
  );
}

function CheckField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-primary"
        checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.checked)}
      />
      <div className="grid gap-1">
        <Label htmlFor={id}>{label}</Label>
        {hint && (
          <p id={`${id}-hint`} className="text-muted-foreground text-xs">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/** A number field that keeps partly typed values local until they make sense. */
function NumberInput({
  label,
  suffix,
  hint,
  shown,
  min,
  max,
  parse,
  onChange,
}: {
  label: string;
  suffix?: string;
  hint?: string;
  shown: string;
  min: number;
  max: number;
  parse: (value: number) => number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="grid min-w-0 content-start gap-1.5">
      <Label htmlFor={id}>
        {label}
        {suffix && <span className="font-normal text-muted-foreground">({suffix})</span>}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step="any"
        value={draft ?? shown}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onFocus={() => setDraft(shown)}
        onBlur={() => setDraft(null)}
        onChange={(event) => {
          setDraft(event.target.value);
          const number = event.target.valueAsNumber;
          if (!Number.isFinite(number)) return;
          const value = parse(number);
          if (value >= min - 1e-6 && value <= max + 1e-6) onChange(value);
        }}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
    </div>
  );
}

function LengthField({
  label,
  hint,
  value,
  unit,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  /** px */
  value: number;
  unit: Unit;
  min: number;
  max: number;
  onChange: (px: number) => void;
}) {
  return (
    <NumberInput
      label={label}
      suffix={unit}
      hint={hint}
      shown={String(roundTo(fromPx(value, unit), UNIT_DECIMALS[unit]))}
      min={min}
      max={max}
      parse={(number) => toPx(number, unit)}
      onChange={onChange}
    />
  );
}

function CountField({
  label,
  suffix,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  suffix?: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <NumberInput
      label={label}
      suffix={suffix}
      hint={hint}
      shown={String(value)}
      min={min}
      max={max}
      parse={Math.round}
      onChange={onChange}
    />
  );
}
