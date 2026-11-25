import { RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { type FormEvent, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  findPresetBySize,
  getPreset,
  PRESET_CATEGORIES,
  type PresetCategory,
  presetSizePx,
  presetsInCategory,
  withOrientation,
} from '@/core/paper';
import { MAX_DESIGN_PX, MIN_DESIGN_PX } from '@/core/schema';
import {
  convertLength,
  formatLength,
  formatSize,
  roundTo,
  toPx,
  UNIT_DECIMALS,
  UNITS,
  type Unit,
} from '@/core/units';
import { PageShape } from '@/features/design/DesignThumbnail';
import { useEffectivePaper } from '@/features/settings/settingsStore';
import { type NewDesignSize, useCreateDesign } from './useCreateDesign';

type OrientationChoice = '' | 'portrait' | 'landscape';

export function CreateDesignDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState<PresetCategory>('paper');
  const [orientation, setOrientation] = useState<OrientationChoice>('');
  const { create, creating } = useCreateDesign();
  const orientationLabelId = useId();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        // Focus the dialog itself rather than the first field, so phones don't pop up
        // the keyboard before the person has chosen to type a custom size.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          contentRef.current?.focus();
        }}
        className="flex max-h-[min(92dvh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogHeader className="border-b p-5 pe-12">
          <DialogTitle>{t('create.title')}</DialogTitle>
          <DialogDescription>{t('create.description')}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <CustomSizeForm creating={creating} onCreate={create} />

          <div className="flex flex-col gap-4 p-5">
            <ToggleGroup
              type="single"
              value={category}
              onValueChange={(value) => value && setCategory(value as PresetCategory)}
              aria-label={t('create.categories')}
              className="w-full max-w-full justify-start overflow-x-auto scrollbar-none sm:flex-wrap"
            >
              {PRESET_CATEGORIES.map((c) => (
                <ToggleGroupItem key={c} value={c} className="shrink-0">
                  {t(`presetCategory.${c}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <div className="flex flex-wrap items-center gap-3">
              <span id={orientationLabelId} className="text-muted-foreground text-sm">
                {t('create.orientation')}
              </span>
              <ToggleGroup
                type="single"
                value={orientation}
                onValueChange={(value) => setOrientation(value as OrientationChoice)}
                aria-labelledby={orientationLabelId}
              >
                <ToggleGroupItem value="portrait">
                  <RectangleVertical aria-hidden="true" />
                  {t('create.portrait')}
                </ToggleGroupItem>
                <ToggleGroupItem value="landscape">
                  <RectangleHorizontal aria-hidden="true" />
                  {t('create.landscape')}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {presetsInCategory(category).map((preset) => {
                const natural = presetSizePx(preset);
                const size = orientation ? withOrientation(natural, orientation) : natural;
                return (
                  <li key={preset.id}>
                    <button
                      type="button"
                      disabled={creating}
                      data-testid={`preset-${preset.id}`}
                      onClick={() => create({ ...size, unit: preset.unit, presetId: preset.id })}
                      className="group flex h-full w-full flex-col items-center gap-2 rounded-xl border p-3 text-center outline-none transition hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"
                    >
                      <span className="flex h-16 w-full items-center justify-center [container-type:size]">
                        <PageShape width={size.width} height={size.height} />
                      </span>
                      <span className="font-medium text-sm">{t(`presets.${preset.id}`)}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatSize(size.width, size.height, preset.unit, i18n.language)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CustomSizeForm({
  creating,
  onCreate,
}: {
  creating: boolean;
  onCreate: (size: NewDesignSize) => void;
}) {
  const { t, i18n } = useTranslation();
  const paper = useEffectivePaper();
  const start = getPreset(paper === 'letter' ? 'letter' : 'a4');
  const [unit, setUnit] = useState<Unit>(start?.unit ?? 'mm');
  const [width, setWidth] = useState(String(start?.width ?? 210));
  const [height, setHeight] = useState(String(start?.height ?? 297));
  const [error, setError] = useState<string | null>(null);
  const formId = useId();

  const changeUnit = (next: Unit) => {
    const convert = (value: string) => {
      const n = Number.parseFloat(value);
      return Number.isFinite(n)
        ? String(roundTo(convertLength(n, unit, next), UNIT_DECIMALS[next]))
        : value;
    };
    setWidth(convert(width));
    setHeight(convert(height));
    setUnit(next);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const w = toPx(Number.parseFloat(width), unit);
    const h = toPx(Number.parseFloat(height), unit);
    const inRange = (v: number) => Number.isFinite(v) && v >= MIN_DESIGN_PX && v <= MAX_DESIGN_PX;
    if (!inRange(w) || !inRange(h)) {
      setError(
        t('create.invalidSize', {
          min: formatLength(MIN_DESIGN_PX, unit, i18n.language),
          max: formatLength(MAX_DESIGN_PX, unit, i18n.language),
        }),
      );
      return;
    }
    setError(null);
    onCreate({ width: w, height: h, unit, presetId: findPresetBySize(w, h)?.id });
  };

  const errorId = `${formId}-error`;
  return (
    <form onSubmit={submit} noValidate className="border-b bg-muted/40 p-5">
      <h3 className="mb-3 font-medium text-sm">{t('create.customTitle')}</h3>
      <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_1fr_7rem_auto]">
        <div className="grid gap-1.5">
          <Label htmlFor={`${formId}-width`}>{t('create.width')}</Label>
          <Input
            id={`${formId}-width`}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${formId}-height`}>{t('create.height')}</Label>
          <Input
            id={`${formId}-height`}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${formId}-unit`}>{t('create.unit')}</Label>
          <NativeSelect
            id={`${formId}-unit`}
            value={unit}
            onChange={(e) => changeUnit(e.target.value as Unit)}
          >
            {UNITS.map((u) => (
              <option key={u} value={u} title={t(`units.${u}`)}>
                {u}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" disabled={creating}>
          {t('create.createCustom')}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-3 text-destructive text-sm">
          {error}
        </p>
      )}
    </form>
  );
}
