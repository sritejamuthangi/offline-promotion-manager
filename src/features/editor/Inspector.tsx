import type { Draft } from 'immer';
import {
  ArrowDown,
  ArrowUp,
  FlipHorizontal,
  FlipVertical,
  ImagePlus,
  Plus,
  Trash2,
} from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { ALIGNMENTS } from '@/core/arrange';
import { createCreditElement, createGridItem } from '@/core/design/elements';
import type {
  Fill,
  GridElement,
  GridTextStyle,
  IconElement,
  ImageElement,
  QrElement,
  Shadow,
  ShapeElement,
  StickerElement,
  Stroke,
  TextElement,
} from '@/core/schema';
import { ICON_NAMES, QR_ERROR_LEVELS, STICKER_NAMES } from '@/core/schema';
import { fromPx, toPx } from '@/core/units';
import { ImagePickerDialog } from '@/features/images/ImagePickerDialog';
import { useSettings } from '@/features/settings/settingsStore';
import { humanize } from '@/lib/humanize';
import { assetIdFromSrc } from '@/render/assetUrl';
import { useImageSrc } from '@/render/imageSource';
import { type AssetRecord, assetRepository } from '@/storage';
import { useAsset } from '@/storage/hooks';
import { useEditor, useEditorStore } from './EditorContext';
import { elementLabel } from './elementLabel';
import { FontSelect } from './FontSelect';
import { ColorField, NumberField } from './fields';

const FONT_WEIGHTS = [
  { value: 400, key: 'regular' },
  { value: 500, key: 'medium' },
  { value: 600, key: 'semibold' },
  { value: 700, key: 'bold' },
  { value: 800, key: 'extraBold' },
  { value: 900, key: 'black' },
] as const;

export function Inspector() {
  const { t } = useTranslation();
  const id = useId();
  const store = useEditorStore();
  const doc = useEditor((s) => s.doc);
  const pageIndex = useEditor((s) => s.pageIndex);
  const ids = useEditor((s) => s.selection);
  const selected = doc.pages[pageIndex]?.elements.filter((e) => ids.includes(e.id)) ?? [];
  const single = selected.length === 1 ? selected[0] : undefined;
  const preference = useSettings((s) => s.unit);
  const unit = preference === 'auto' ? doc.unit : preference;

  if (!selected.length)
    return (
      <div className="space-y-5 p-4">
        <div>
          <h2 className="font-semibold text-sm">{t('editor.page')}</h2>
          <p className="mt-1 text-muted-foreground text-xs">{t('editor.emptyHint')}</p>
        </div>
        <FillEditor
          allowImage
          frame={doc}
          value={doc.pages[pageIndex]?.background ?? { type: 'solid', color: '$background' }}
          onChange={(fill) =>
            store.getState().edit((d) => {
              const page = d.pages[pageIndex];
              if (page) page.background = fill;
            })
          }
        />
      </div>
    );

  return (
    <div className="space-y-4 p-4">
      <h2 className="truncate font-semibold text-sm">
        {single ? elementLabel(single, t) : t('editor.selectedCount', { count: selected.length })}
      </h2>
      {single && (single.locked || single.hidden) && (
        <p className="text-muted-foreground text-xs">{t('editor.lockedHint')}</p>
      )}
      <fieldset
        disabled={single?.locked || single?.hidden}
        className="space-y-5 disabled:opacity-50"
      >
        {single && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {(['x', 'y', 'width', 'height'] as const).map((key) => (
                <NumberField
                  key={key}
                  label={t(`editor.geometry.${key}`)}
                  suffix={unit}
                  value={fromPx(single[key], unit)}
                  min={key === 'width' || key === 'height' ? fromPx(1, unit) : -100_000}
                  max={fromPx(100_000, unit)}
                  onChange={(value) =>
                    store.getState().updateSelected((e) => {
                      e[key] = toPx(value, unit);
                    })
                  }
                />
              ))}
              <NumberField
                label={t('editor.rotation')}
                suffix="°"
                value={single.rotation}
                min={-360}
                max={360}
                onChange={(value) =>
                  store.getState().updateSelected((e) => {
                    e.rotation = value;
                  })
                }
              />
              <NumberField
                label={t('editor.opacity')}
                suffix="%"
                value={single.opacity * 100}
                min={0}
                max={100}
                onChange={(value) =>
                  store.getState().updateSelected((e) => {
                    e.opacity = value / 100;
                  })
                }
              />
            </div>
            {single.type === 'text' && <TextInspector element={single} />}
            {single.type === 'shape' && <ShapeInspector element={single} />}
            {single.type === 'image' && <ImageInspector element={single} />}
            {single.type === 'icon' && <IconInspector element={single} />}
            {single.type === 'sticker' && <StickerInspector element={single} />}
            {single.type === 'qr' && <QrInspector element={single} />}
            {single.type === 'grid' && <GridInspector element={single} />}
            {single.type === 'line' && (
              <div className="space-y-3 border-t pt-4">
                <ColorField
                  label={t('editor.color')}
                  value={single.stroke.color}
                  theme={doc.theme}
                  onChange={(color) =>
                    store.getState().updateSelected((e) => {
                      if (e.type === 'line') e.stroke.color = color;
                    })
                  }
                />
                <NumberField
                  label={t('editor.strokeWidth')}
                  suffix="px"
                  value={single.stroke.width}
                  min={0.1}
                  max={500}
                  onChange={(value) =>
                    store.getState().updateSelected((e) => {
                      if (e.type === 'line') {
                        e.stroke.width = value;
                        e.height = Math.max(1, value);
                      }
                    })
                  }
                />
                <DashField
                  value={single.stroke.dash}
                  onChange={(dash) =>
                    store.getState().updateSelected((e) => {
                      if (e.type === 'line') e.stroke.dash = dash;
                    })
                  }
                />
                {(['startCap', 'endCap'] as const).map((key) => (
                  <div key={key} className="grid gap-1.5">
                    <Label htmlFor={`${id}-${key}`} className="text-muted-foreground text-xs">
                      {t(`editor.${key}`)}
                    </Label>
                    <NativeSelect
                      id={`${id}-${key}`}
                      value={single[key]}
                      onChange={(event) =>
                        store.getState().updateSelected((e) => {
                          if (e.type === 'line') e[key] = event.target.value as typeof e.startCap;
                        })
                      }
                    >
                      {(['none', 'arrow', 'circle', 'square'] as const).map((cap) => (
                        <option key={cap} value={cap}>
                          {t(`editor.caps.${cap}`)}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        <ArrangeInspector count={selected.length} />
      </fieldset>
    </div>
  );
}

function TextInspector({ element }: { element: TextElement }) {
  const { t } = useTranslation();
  const store = useEditorStore();
  const theme = useEditor((s) => s.doc.theme);
  const id = useId();
  const change = <K extends keyof TextElement['style']>(key: K, value: TextElement['style'][K]) =>
    store.getState().updateSelected((e) => {
      if (e.type === 'text') e.style[key] = value;
    });
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="grid gap-1.5">
        <Label htmlFor={id}>{t('editor.textContent')}</Label>
        <textarea
          id={id}
          rows={3}
          value={element.text}
          dir={element.direction ?? 'auto'}
          className="w-full resize-y rounded-md border bg-background p-2 text-base outline-none focus:ring-2 focus:ring-ring lg:text-sm"
          onFocus={() => store.getState().begin()}
          onBlur={() => store.getState().commit()}
          onChange={(event) =>
            store.getState().updateSelected((e) => {
              if (e.type === 'text') e.text = event.target.value;
            })
          }
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-font`} className="text-muted-foreground text-xs">
          {t('editor.font')}
        </Label>
        <FontSelect
          id={`${id}-font`}
          value={element.style.fontFamily}
          onChange={(font) => change('fontFamily', font)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t('editor.fontSize')}
          suffix="pt"
          value={fromPx(element.style.fontSize, 'pt')}
          min={0.5}
          max={7500}
          onChange={(value) => change('fontSize', toPx(value, 'pt'))}
        />
        <NumberField
          label={t('editor.lineHeight')}
          value={element.style.lineHeight}
          min={0.5}
          max={5}
          step={0.1}
          onChange={(v) => change('lineHeight', v)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t('editor.letterSpacing')}
          suffix="em"
          value={element.style.letterSpacing}
          min={-0.2}
          max={1}
          step={0.01}
          onChange={(v) => change('letterSpacing', v)}
        />
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-case`} className="text-muted-foreground text-xs">
            {t('editor.textCase')}
          </Label>
          <NativeSelect
            id={`${id}-case`}
            value={element.style.textTransform ?? 'none'}
            onChange={(e) =>
              change('textTransform', e.target.value as TextElement['style']['textTransform'])
            }
          >
            {(['none', 'uppercase', 'lowercase', 'capitalize'] as const).map((value) => (
              <option key={value} value={value}>
                {t(`editor.textCaseOptions.${value}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        <Button
          variant={element.style.fontWeight >= 700 ? 'secondary' : 'outline'}
          size="sm"
          aria-pressed={element.style.fontWeight >= 700}
          onClick={() => change('fontWeight', element.style.fontWeight >= 700 ? 400 : 700)}
        >
          {t('editor.bold')}
        </Button>
        <Button
          variant={element.style.italic ? 'secondary' : 'outline'}
          size="sm"
          aria-pressed={!!element.style.italic}
          onClick={() => change('italic', !element.style.italic)}
        >
          {t('editor.italic')}
        </Button>
        <Button
          variant={element.style.underline ? 'secondary' : 'outline'}
          size="sm"
          aria-pressed={!!element.style.underline}
          onClick={() => change('underline', !element.style.underline)}
        >
          {t('editor.underline')}
        </Button>
        <Button
          variant={element.style.strikethrough ? 'secondary' : 'outline'}
          size="sm"
          aria-pressed={!!element.style.strikethrough}
          onClick={() => change('strikethrough', !element.style.strikethrough)}
        >
          {t('editor.strikethrough')}
        </Button>
      </div>
      <ColorField
        label={t('editor.color')}
        value={element.style.color}
        theme={theme}
        onChange={(value) => change('color', value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-align`} className="text-muted-foreground text-xs">
            {t('editor.textAlign')}
          </Label>
          <NativeSelect
            id={`${id}-align`}
            value={element.style.align}
            onChange={(e) => change('align', e.target.value as TextElement['style']['align'])}
          >
            {(['start', 'center', 'end', 'justify'] as const).map((v) => (
              <option key={v} value={v}>
                {t(`editor.textAlignment.${v}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-vertical`} className="text-muted-foreground text-xs">
            {t('editor.verticalAlign')}
          </Label>
          <NativeSelect
            id={`${id}-vertical`}
            value={element.style.verticalAlign}
            onChange={(e) =>
              change('verticalAlign', e.target.value as TextElement['style']['verticalAlign'])
            }
          >
            {(['top', 'middle', 'bottom'] as const).map((v) => (
              <option key={v} value={v}>
                {t(`editor.verticalAlignment.${v}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-direction`} className="text-muted-foreground text-xs">
          {t('editor.direction')}
        </Label>
        <NativeSelect
          id={`${id}-direction`}
          value={element.direction ?? 'auto'}
          onChange={(event) =>
            store.getState().updateSelected((e) => {
              if (e.type === 'text') e.direction = event.target.value as TextElement['direction'];
            })
          }
        >
          {(['auto', 'ltr', 'rtl'] as const).map((v) => (
            <option key={v} value={v}>
              {t(`editor.directions.${v}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <BorderEditor
        label={t('editor.outline')}
        stroke={element.style.stroke}
        maxWidth={Math.max(1, element.style.fontSize / 2)}
        onChange={(stroke) => change('stroke', stroke)}
      />
      <ShadowEditor shadow={element.style.shadow} onChange={(shadow) => change('shadow', shadow)} />
    </div>
  );
}

function ShapeInspector({ element }: { element: ShapeElement }) {
  const { t } = useTranslation();
  const store = useEditorStore();
  return (
    <div className="space-y-3 border-t pt-4">
      <FillEditor
        value={element.fill}
        onChange={(fill) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'shape') e.fill = fill;
          })
        }
      />
      {element.shape === 'rect' && (
        <NumberField
          label={t('editor.radius')}
          suffix="px"
          value={element.radius ?? 0}
          min={0}
          max={Math.min(element.width, element.height) / 2}
          onChange={(value) =>
            store.getState().updateSelected((e) => {
              if (e.type === 'shape') e.radius = value;
            })
          }
        />
      )}
      <BorderEditor
        label={t('editor.border')}
        stroke={element.stroke}
        maxWidth={Math.min(element.width, element.height) / 2}
        onChange={(stroke) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'shape') e.stroke = stroke;
          })
        }
      />
      <ShadowEditor
        shadow={element.shadow}
        onChange={(shadow) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'shape') e.shadow = shadow;
          })
        }
      />
    </div>
  );
}

function ImageInspector({ element }: { element: ImageElement }) {
  const { t } = useTranslation();
  const store = useEditorStore();
  const theme = useEditor((s) => s.doc.theme);
  const id = useId();
  const [picking, setPicking] = useState(false);
  return (
    <div className="space-y-3 border-t pt-4">
      <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
        <ImagePlus />
        {t('editor.replaceImage')}
      </Button>
      <ImagePickerDialog
        open={picking}
        onOpenChange={setPicking}
        theme={theme}
        frame={element}
        initialTab={element.src.startsWith('library:') ? 'library' : 'uploads'}
        onPick={(choice) =>
          store.getState().updateSelected((e) => {
            if (e.type !== 'image') return;
            e.src = choice.src;
            e.alt = choice.alt ?? e.alt;
          })
        }
      />
      <ImageCredit element={element} />
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-alt`} className="text-muted-foreground text-xs">
          {t('editor.altText')}
        </Label>
        <Input
          id={`${id}-alt`}
          value={element.alt ?? ''}
          onFocus={() => store.getState().begin()}
          onBlur={() => store.getState().commit()}
          onChange={(event) =>
            store.getState().updateSelected((e) => {
              if (e.type === 'image') e.alt = event.target.value;
            })
          }
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-fit`} className="text-muted-foreground text-xs">
          {t('editor.imageFit')}
        </Label>
        <NativeSelect
          id={`${id}-fit`}
          value={element.fit}
          onChange={(event) =>
            store.getState().updateSelected((e) => {
              if (e.type === 'image') e.fit = event.target.value as ImageElement['fit'];
            })
          }
        >
          {(['cover', 'contain', 'fill'] as const).map((fit) => (
            <option key={fit} value={fit}>
              {t(`editor.fits.${fit}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <NumberField
        label={t('editor.radius')}
        suffix="px"
        value={element.radius ?? 0}
        min={0}
        max={Math.min(element.width, element.height) / 2}
        onChange={(value) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'image') e.radius = value;
          })
        }
      />
      <div className="flex flex-wrap gap-1">
        <Button
          variant={element.flipX ? 'secondary' : 'outline'}
          size="sm"
          aria-pressed={!!element.flipX}
          onClick={() =>
            store.getState().updateSelected((e) => {
              if (e.type === 'image') e.flipX = !e.flipX;
            })
          }
        >
          <FlipHorizontal />
          {t('editor.flipHorizontal')}
        </Button>
        <Button
          variant={element.flipY ? 'secondary' : 'outline'}
          size="sm"
          aria-pressed={!!element.flipY}
          onClick={() =>
            store.getState().updateSelected((e) => {
              if (e.type === 'image') e.flipY = !e.flipY;
            })
          }
        >
          <FlipVertical />
          {t('editor.flipVertical')}
        </Button>
      </div>
      <BorderEditor
        label={t('editor.border')}
        stroke={element.stroke}
        maxWidth={Math.min(element.width, element.height) / 2}
        onChange={(stroke) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'image') e.stroke = stroke;
          })
        }
      />
      <ShadowEditor
        shadow={element.shadow}
        onChange={(shadow) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'image') e.shadow = shadow;
          })
        }
      />
    </div>
  );
}

/** Licence and credit for images found with online search, with a one-click credit line. */
function ImageCredit({
  element,
}: {
  element: Pick<ImageElement, 'src' | 'x' | 'y' | 'width' | 'height'>;
}) {
  const { t } = useTranslation();
  const store = useEditorStore();
  const asset = useAsset(assetIdFromSrc(element.src));
  const source = asset?.source;
  if (!source || (source.kind !== 'openverse' && source.kind !== 'wikimedia')) return null;
  const credit =
    source.attribution ??
    [source.title, source.creator, source.license].filter(Boolean).join(' · ');
  const link = 'font-medium text-primary underline-offset-4 hover:underline';
  return (
    <section
      aria-label={t('images.credit.title')}
      className="space-y-2 rounded-md border bg-muted/30 p-3 text-xs"
    >
      <h3 className="font-medium">{t('images.credit.title')}</h3>
      <p className="break-words">{credit}</p>
      <p className="text-muted-foreground">{t('images.credit.hint')}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {source.url && (
          <a href={source.url} target="_blank" rel="noopener noreferrer" className={link}>
            {t('images.credit.source')}
          </a>
        )}
        {source.licenseUrl && (
          <a href={source.licenseUrl} target="_blank" rel="noopener noreferrer" className={link}>
            {t('images.credit.license')}
          </a>
        )}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          store.getState().commit();
          store
            .getState()
            .insertElement(createCreditElement(store.getState().doc, element, credit));
          toast.success(t('images.credit.added'));
        }}
      >
        {t('images.credit.add')}
      </Button>
    </section>
  );
}

function IconInspector({ element }: { element: IconElement }) {
  const { t } = useTranslation();
  const store = useEditorStore();
  const theme = useEditor((s) => s.doc.theme);
  const id = useId();
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-icon`} className="text-muted-foreground text-xs">
          {t('editor.icon')}
        </Label>
        <NativeSelect
          id={`${id}-icon`}
          value={element.icon}
          onChange={(event) =>
            store.getState().updateSelected((e) => {
              if (e.type === 'icon') e.icon = event.target.value as IconElement['icon'];
            })
          }
        >
          {ICON_NAMES.map((name) => (
            <option key={name} value={name}>
              {humanize(name)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <ColorField
        label={t('editor.color')}
        value={element.color}
        theme={theme}
        onChange={(color) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'icon') e.color = color;
          })
        }
      />
      <NumberField
        label={t('editor.strokeWidth')}
        value={element.strokeWidth}
        min={0.25}
        max={8}
        step={0.25}
        onChange={(value) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'icon') e.strokeWidth = value;
          })
        }
      />
    </div>
  );
}

function StickerInspector({ element }: { element: StickerElement }) {
  const { t } = useTranslation();
  const store = useEditorStore();
  const id = useId();
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-sticker`} className="text-muted-foreground text-xs">
          {t('editor.sticker')}
        </Label>
        <NativeSelect
          id={`${id}-sticker`}
          value={element.sticker}
          onChange={(event) =>
            store.getState().updateSelected((e) => {
              if (e.type === 'sticker') e.sticker = event.target.value as StickerElement['sticker'];
            })
          }
        >
          {STICKER_NAMES.map((name) => (
            <option key={name} value={name}>
              {humanize(name)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <FillEditor
        value={element.fill}
        onChange={(fill) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'sticker') e.fill = fill;
          })
        }
      />
      <BorderEditor
        label={t('editor.border')}
        stroke={element.stroke}
        maxWidth={Math.min(element.width, element.height) / 4}
        onChange={(stroke) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'sticker') e.stroke = stroke;
          })
        }
      />
      <ShadowEditor
        shadow={element.shadow}
        onChange={(shadow) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'sticker') e.shadow = shadow;
          })
        }
      />
    </div>
  );
}

function QrInspector({ element }: { element: QrElement }) {
  const { t } = useTranslation();
  const store = useEditorStore();
  const theme = useEditor((s) => s.doc.theme);
  const id = useId();
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-value`}>{t('editor.qr.value')}</Label>
        <textarea
          id={`${id}-value`}
          rows={3}
          maxLength={3000}
          value={element.value}
          className="w-full resize-y rounded-md border bg-background p-2 font-mono text-base outline-none focus:ring-2 focus:ring-ring lg:text-sm"
          onFocus={() => store.getState().begin()}
          onBlur={() => store.getState().commit()}
          onChange={(event) =>
            store.getState().updateSelected((e) => {
              if (e.type === 'qr') e.value = event.target.value;
            })
          }
        />
        <p className="text-muted-foreground text-xs">{t('editor.qr.editHint')}</p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-ec`} className="text-muted-foreground text-xs">
          {t('editor.qr.errorLevel')}
        </Label>
        <NativeSelect
          id={`${id}-ec`}
          value={element.ecLevel}
          onChange={(event) =>
            store.getState().updateSelected((e) => {
              if (e.type === 'qr') e.ecLevel = event.target.value as QrElement['ecLevel'];
            })
          }
        >
          {QR_ERROR_LEVELS.map((level) => (
            <option key={level} value={level}>
              {t(`editor.qr.errorLevels.${level}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <NumberField
        label={t('editor.qr.margin')}
        value={element.margin ?? 2}
        min={0}
        max={16}
        step={1}
        onChange={(value) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'qr') e.margin = Math.round(value);
          })
        }
      />
      <ColorField
        label={t('editor.qr.foreground')}
        value={element.foreground}
        theme={theme}
        onChange={(color) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'qr') e.foreground = color;
          })
        }
      />
      <ColorField
        label={t('editor.qr.background')}
        value={element.background}
        theme={theme}
        onChange={(color) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'qr') e.background = color;
          })
        }
      />
    </div>
  );
}

function GridInspector({ element }: { element: GridElement }) {
  const { t } = useTranslation();
  const store = useEditorStore();
  const id = useId();
  const update = (recipe: (grid: Draft<GridElement>) => void) =>
    store.getState().updateSelected((e) => {
      if (e.type === 'grid') recipe(e);
    });
  return (
    <div className="space-y-4 border-t pt-4">
      <section className="space-y-2">
        <h3 className="font-medium text-xs">{t('editor.grid.items')}</h3>
        {element.items.map((item, index) => (
          <div key={item.id} className="space-y-2 rounded-md border bg-muted/30 p-2">
            <div className="flex items-center gap-1">
              <span className="w-5 text-center text-muted-foreground text-xs tabular-nums">
                {index + 1}
              </span>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                title={t('editor.grid.moveUp')}
                aria-label={t('editor.grid.moveUp')}
                disabled={index === 0}
                onClick={() =>
                  update((grid) => {
                    const [moved] = grid.items.splice(index, 1);
                    if (moved) grid.items.splice(index - 1, 0, moved);
                  })
                }
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                title={t('editor.grid.moveDown')}
                aria-label={t('editor.grid.moveDown')}
                disabled={index === element.items.length - 1}
                onClick={() =>
                  update((grid) => {
                    const [moved] = grid.items.splice(index, 1);
                    if (moved) grid.items.splice(index + 1, 0, moved);
                  })
                }
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="ms-auto text-destructive"
                title={t('editor.grid.removeItem')}
                aria-label={t('editor.grid.removeItem')}
                onClick={() =>
                  update((grid) => {
                    grid.items.splice(index, 1);
                  })
                }
              >
                <Trash2 />
              </Button>
            </div>
            <Input
              aria-label={`${t('editor.grid.itemName')} ${index + 1}`}
              placeholder={t('editor.grid.itemName')}
              value={item.name}
              onFocus={() => store.getState().begin()}
              onBlur={() => store.getState().commit()}
              onChange={(event) =>
                update((grid) => {
                  const target = grid.items[index];
                  if (target) target.name = event.target.value;
                })
              }
            />
            <Input
              aria-label={`${t('editor.grid.itemSubtitle')} ${index + 1}`}
              placeholder={t('editor.grid.itemSubtitle')}
              value={item.subtitle ?? ''}
              onFocus={() => store.getState().begin()}
              onBlur={() => store.getState().commit()}
              onChange={(event) =>
                update((grid) => {
                  const target = grid.items[index];
                  if (target) target.subtitle = event.target.value || undefined;
                })
              }
            />
            <div className="flex flex-wrap items-center gap-1">
              <UploadImageButton
                label={item.logoSrc ? t('editor.grid.replaceLogo') : t('editor.grid.addLogo')}
                onUploaded={(asset) =>
                  update((grid) => {
                    const target = grid.items[index];
                    if (target) target.logoSrc = `asset:${asset.id}`;
                  })
                }
              />
              {item.logoSrc && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    update((grid) => {
                      const target = grid.items[index];
                      if (target) delete target.logoSrc;
                    })
                  }
                >
                  <Trash2 />
                  {t('editor.grid.removeLogo')}
                </Button>
              )}
            </div>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={element.items.length >= 100}
          onClick={() => update((grid) => grid.items.push(createGridItem(t('editor.grid.item'))))}
        >
          <Plus />
          {t('editor.grid.addItem')}
        </Button>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium text-xs">{t('editor.grid.layout')}</h3>
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-columns`} className="text-muted-foreground text-xs">
            {t('editor.grid.columns')}
          </Label>
          <NativeSelect
            id={`${id}-columns`}
            value={element.columns ? String(element.columns) : 'auto'}
            onChange={(event) =>
              update((grid) => {
                const value = event.target.value;
                grid.columns = value === 'auto' ? undefined : Number(value);
              })
            }
          >
            <option value="auto">{t('editor.grid.autoColumns')}</option>
            {[1, 2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label={t('editor.grid.gap')}
            suffix="px"
            value={element.gap}
            min={0}
            max={10_000}
            onChange={(value) =>
              update((grid) => {
                grid.gap = value;
              })
            }
          />
          <NumberField
            label={t('editor.grid.padding')}
            suffix="px"
            value={element.padding}
            min={0}
            max={10_000}
            onChange={(value) =>
              update((grid) => {
                grid.padding = value;
              })
            }
          />
          <NumberField
            label={t('editor.grid.cardPadding')}
            suffix="px"
            value={element.cardPadding}
            min={0}
            max={10_000}
            onChange={(value) =>
              update((grid) => {
                grid.cardPadding = value;
              })
            }
          />
          <NumberField
            label={t('editor.grid.cardRadius')}
            suffix="px"
            value={element.cardRadius}
            min={0}
            max={10_000}
            onChange={(value) =>
              update((grid) => {
                grid.cardRadius = value;
              })
            }
          />
          <NumberField
            label={t('editor.grid.logoHeight')}
            suffix="px"
            value={element.logoHeight}
            min={1}
            max={10_000}
            onChange={(value) =>
              update((grid) => {
                grid.logoHeight = value;
              })
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-medium text-xs">{t('editor.grid.cards')}</h3>
        <FillEditor
          allowImage
          value={element.cardFill}
          onChange={(fill) =>
            update((grid) => {
              grid.cardFill = fill;
            })
          }
        />
        <BorderEditor
          label={t('editor.border')}
          stroke={element.cardStroke}
          maxWidth={Math.min(element.width, element.height) / 4}
          onChange={(stroke) =>
            update((grid) => {
              grid.cardStroke = stroke;
            })
          }
        />
        <ShadowEditor
          shadow={element.shadow}
          onChange={(shadow) =>
            update((grid) => {
              grid.shadow = shadow;
            })
          }
        />
      </section>

      <GridTextStyleEditor
        title={t('editor.grid.nameStyle')}
        style={element.nameStyle}
        onChange={(style) =>
          update((grid) => {
            grid.nameStyle = style;
          })
        }
      />
      <GridTextStyleEditor
        title={t('editor.grid.subtitleStyle')}
        style={element.subtitleStyle}
        onChange={(style) =>
          update((grid) => {
            grid.subtitleStyle = style;
          })
        }
      />
    </div>
  );
}

function GridTextStyleEditor({
  title,
  style,
  onChange,
}: {
  title: string;
  style: GridTextStyle;
  onChange: (style: GridTextStyle) => void;
}) {
  const { t } = useTranslation();
  const theme = useEditor((s) => s.doc.theme);
  const id = useId();
  return (
    <section className="space-y-3 border-t pt-4">
      <h3 className="font-medium text-xs">{title}</h3>
      <div className="grid gap-1.5">
        <Label htmlFor={`${id}-font`} className="text-muted-foreground text-xs">
          {t('editor.font')}
        </Label>
        <FontSelect
          id={`${id}-font`}
          value={style.fontFamily}
          onChange={(font) => onChange({ ...style, fontFamily: font })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t('editor.fontSize')}
          suffix="pt"
          value={fromPx(style.fontSize, 'pt')}
          min={0.5}
          max={7500}
          onChange={(value) => onChange({ ...style, fontSize: toPx(value, 'pt') })}
        />
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-weight`} className="text-muted-foreground text-xs">
            {t('editor.fontWeight')}
          </Label>
          <NativeSelect
            id={`${id}-weight`}
            value={style.fontWeight}
            onChange={(event) => onChange({ ...style, fontWeight: Number(event.target.value) })}
          >
            {FONT_WEIGHTS.map(({ value, key }) => (
              <option key={value} value={value}>
                {t(`editor.fontWeights.${key}`)}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      <ColorField
        label={t('editor.color')}
        value={style.color}
        theme={theme}
        onChange={(color) => onChange({ ...style, color })}
      />
    </section>
  );
}

function FillEditor({
  value,
  onChange,
  allowImage = false,
  frame,
}: {
  value: Fill;
  onChange: (fill: Fill) => void;
  allowImage?: boolean;
  /** Size of the filled area, so background previews match its shape. */
  frame?: { width: number; height: number };
}) {
  const { t } = useTranslation();
  const id = useId();
  const theme = useEditor((s) => s.doc.theme);
  const [picking, setPicking] = useState(false);
  const imageUrl = useImageSrc(value.type === 'image' ? value.src : undefined, theme, frame);
  const first =
    value.type === 'solid'
      ? value.color
      : value.type !== 'image'
        ? (value.stops[0]?.color ?? '#ffffff')
        : '#ffffff';
  const second =
    value.type === 'linear' || value.type === 'radial'
      ? (value.stops.at(-1)?.color ?? '#6d28d9')
      : '#6d28d9';
  const gradient = value.type === 'linear' || value.type === 'radial';
  return (
    <div className="space-y-3">
      <div className="grid gap-1.5">
        <Label htmlFor={id} className="text-muted-foreground text-xs">
          {t('editor.fill')}
        </Label>
        <NativeSelect
          id={id}
          value={value.type}
          onChange={(e) => {
            if (e.target.value === 'solid') onChange({ type: 'solid', color: first });
            else if (e.target.value === 'linear')
              onChange({
                type: 'linear',
                angle: 135,
                stops: [
                  { offset: 0, color: first },
                  { offset: 1, color: second },
                ],
              });
            else
              onChange({
                type: 'radial',
                cx: 0.5,
                cy: 0.5,
                stops: [
                  { offset: 0, color: first },
                  { offset: 1, color: second },
                ],
              });
          }}
        >
          <option value="solid">{t('editor.solid')}</option>
          <option value="linear">{t('editor.linear')}</option>
          <option value="radial">{t('editor.radial')}</option>
          {value.type === 'image' && <option value="image">{t('editor.image')}</option>}
        </NativeSelect>
      </div>
      <ColorField
        label={gradient ? t('editor.startColor') : t('editor.color')}
        value={first}
        theme={theme}
        onChange={(color) =>
          onChange(
            gradient
              ? { ...value, stops: value.stops.map((s, i) => (i === 0 ? { ...s, color } : s)) }
              : { type: 'solid', color },
          )
        }
      />
      {gradient && (
        <ColorField
          label={t('editor.endColor')}
          value={second}
          theme={theme}
          onChange={(color) =>
            onChange({
              ...value,
              stops: value.stops.map((s, i) =>
                i === value.stops.length - 1 ? { ...s, color } : s,
              ),
            })
          }
        />
      )}
      {value.type === 'linear' && (
        <NumberField
          label={t('editor.gradientAngle')}
          suffix="°"
          value={value.angle}
          min={-360}
          max={360}
          onChange={(angle) => onChange({ ...value, angle })}
        />
      )}
      {allowImage && (
        <div className="space-y-2">
          {value.type === 'image' && imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="h-20 w-full rounded-md border object-cover"
              draggable={false}
            />
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
            <ImagePlus />
            {value.type === 'image' ? t('editor.replaceImage') : t('editor.chooseImage')}
          </Button>
          <ImagePickerDialog
            open={picking}
            onOpenChange={setPicking}
            theme={theme}
            frame={frame}
            initialTab="library"
            initialCategory="backgrounds"
            onPick={(choice) =>
              onChange({
                type: 'image',
                src: choice.src,
                // Built-in backgrounds are drawn to fit exactly; photos keep their fit.
                fit: choice.adaptive ? 'cover' : value.type === 'image' ? value.fit : 'cover',
              })
            }
          />
          {value.type === 'image' && frame && (
            <ImageCredit element={{ src: value.src, x: 0, y: 0, ...frame }} />
          )}
          {value.type === 'image' && (
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-fit`} className="text-muted-foreground text-xs">
                {t('editor.imageFit')}
              </Label>
              <NativeSelect
                id={`${id}-fit`}
                value={value.fit}
                onChange={(event) =>
                  onChange({
                    ...value,
                    fit: event.target.value as Extract<Fill, { type: 'image' }>['fit'],
                  })
                }
              >
                {(['cover', 'contain', 'tile'] as const).map((fit) => (
                  <option key={fit} value={fit}>
                    {t(`editor.fits.${fit}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DashField({
  value,
  onChange,
}: {
  value?: Stroke['dash'];
  onChange: (dash: Stroke['dash']) => void;
}) {
  const { t } = useTranslation();
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        {t('editor.lineStyle')}
      </Label>
      <NativeSelect
        id={id}
        value={value ?? 'solid'}
        onChange={(event) => onChange(event.target.value as Stroke['dash'])}
      >
        {(['solid', 'dashed', 'dotted'] as const).map((dash) => (
          <option key={dash} value={dash}>
            {t(`editor.dashes.${dash}`)}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

function BorderEditor({
  label,
  stroke,
  onChange,
  maxWidth = 100,
}: {
  label: string;
  stroke?: Stroke;
  onChange: (stroke: Stroke | undefined) => void;
  maxWidth?: number;
}) {
  const { t } = useTranslation();
  const theme = useEditor((s) => s.doc.theme);
  const enabled = Boolean(stroke && stroke.width > 0);
  return (
    <section className="space-y-3">
      <label className="flex items-center gap-2 font-medium text-xs">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) =>
            onChange(event.target.checked ? { color: '$text', width: 2, dash: 'solid' } : undefined)
          }
        />
        {label}
      </label>
      {enabled && stroke && (
        <>
          <ColorField
            label={t('editor.color')}
            value={stroke.color}
            theme={theme}
            onChange={(color) => onChange({ ...stroke, color })}
          />
          <NumberField
            label={t('editor.strokeWidth')}
            suffix="px"
            value={stroke.width}
            min={0.1}
            max={maxWidth}
            onChange={(width) => onChange({ ...stroke, width })}
          />
          <DashField value={stroke.dash} onChange={(dash) => onChange({ ...stroke, dash })} />
        </>
      )}
    </section>
  );
}

function ShadowEditor({
  shadow,
  onChange,
}: {
  shadow?: Shadow;
  onChange: (shadow: Shadow | undefined) => void;
}) {
  const { t } = useTranslation();
  const theme = useEditor((s) => s.doc.theme);
  const enabled = Boolean(shadow);
  return (
    <section className="space-y-3">
      <label className="flex items-center gap-2 font-medium text-xs">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) =>
            onChange(
              event.target.checked
                ? { color: '#00000040', blur: 8, offsetX: 0, offsetY: 2 }
                : undefined,
            )
          }
        />
        {t('editor.shadow')}
      </label>
      {enabled && shadow && (
        <>
          <ColorField
            label={t('editor.color')}
            value={shadow.color}
            theme={theme}
            onChange={(color) => onChange({ ...shadow, color })}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={t('editor.blur')}
              suffix="px"
              value={shadow.blur}
              min={0}
              max={1000}
              onChange={(blur) => onChange({ ...shadow, blur })}
            />
            <NumberField
              label={t('editor.offsetX')}
              suffix="px"
              value={shadow.offsetX}
              min={-1000}
              max={1000}
              onChange={(offsetX) => onChange({ ...shadow, offsetX })}
            />
            <NumberField
              label={t('editor.offsetY')}
              suffix="px"
              value={shadow.offsetY}
              min={-1000}
              max={1000}
              onChange={(offsetY) => onChange({ ...shadow, offsetY })}
            />
          </div>
        </>
      )}
    </section>
  );
}

function UploadImageButton({
  label,
  onUploaded,
}: {
  label: string;
  onUploaded: (asset: AssetRecord) => void;
}) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            toast.error(t('editor.imageError'));
            return;
          }
          setBusy(true);
          assetRepository
            .add({ blob: file, name: file.name, type: file.type })
            .then(onUploaded)
            .catch(() => toast.error(t('editor.imageError')))
            .finally(() => setBusy(false));
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <ImagePlus />
        {busy ? t('editor.uploading') : label}
      </Button>
    </>
  );
}

function ArrangeInspector({ count }: { count: number }) {
  const { t } = useTranslation();
  const store = useEditorStore();
  const [toPage, setToPage] = useState(false);
  const icons = { left: '⇤', center: '↔', right: '⇥', top: '↥', middle: '↕', bottom: '↧' };
  return (
    <section className="space-y-3 border-t pt-4" aria-label={t('editor.arrange')}>
      <h3 className="font-medium text-xs">{t('editor.arrange')}</h3>
      {count > 1 && (
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={toPage} onChange={(e) => setToPage(e.target.checked)} />
          {t('editor.alignPage')}
        </label>
      )}
      <div className="grid grid-cols-6 gap-1">
        {ALIGNMENTS.map((alignment) => (
          <Button
            key={alignment}
            size="icon-sm"
            variant="outline"
            title={t(`editor.alignment.${alignment}`)}
            aria-label={t(`editor.alignment.${alignment}`)}
            onClick={() => store.getState().arrange(alignment, toPage)}
          >
            <span aria-hidden="true">{icons[alignment]}</span>
          </Button>
        ))}
      </div>
      {count >= 3 && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => store.getState().distribute('x')}>
            {t('editor.distributeX')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => store.getState().distribute('y')}>
            {t('editor.distributeY')}
          </Button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {(['front', 'back', 'forward', 'backward'] as const).map((move) => (
          <Button
            key={move}
            variant="outline"
            size="sm"
            onClick={() => store.getState().reorder(move)}
          >
            {t(`editor.layerMove.${move}`)}
          </Button>
        ))}
      </div>
    </section>
  );
}
