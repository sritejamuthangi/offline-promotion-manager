import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { ALIGNMENTS } from '@/core/arrange';
import type { Fill, ShapeElement, TextElement } from '@/core/schema';
import { fromPx, toPx } from '@/core/units';
import { useSettings } from '@/features/settings/settingsStore';
import { useEditor, useEditorStore } from './EditorContext';
import { elementLabel } from './elementLabel';
import { ColorField, NumberField } from './fields';

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
          value={doc.pages[pageIndex]?.background ?? { type: 'solid', color: '#ffffff' }}
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
        <NativeSelect
          id={`${id}-font`}
          value={element.style.fontFamily}
          onChange={(e) => change('fontFamily', e.target.value)}
        >
          <option value="$heading">{t('editor.themeHeading')}</option>
          <option value="$body">{t('editor.themeBody')}</option>
          {['Inter', 'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'].map(
            (font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ),
          )}
        </NativeSelect>
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
      <div className="flex gap-1">
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
      </div>
    </div>
  );
}

function ShapeInspector({ element }: { element: ShapeElement }) {
  const { t } = useTranslation();
  const store = useEditorStore();
  const theme = useEditor((s) => s.doc.theme);
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
      <ColorField
        label={t('editor.strokeColor')}
        value={element.stroke?.color ?? '$text'}
        theme={theme}
        onChange={(color) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'shape') e.stroke = { width: e.stroke?.width || 2, color };
          })
        }
      />
      <NumberField
        label={t('editor.strokeWidth')}
        suffix="px"
        value={element.stroke?.width ?? 0}
        min={0}
        max={Math.min(element.width, element.height) / 2}
        onChange={(value) =>
          store.getState().updateSelected((e) => {
            if (e.type === 'shape')
              e.stroke = { ...e.stroke, color: e.stroke?.color ?? '$text', width: value };
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
    </div>
  );
}

function FillEditor({ value, onChange }: { value: Fill; onChange: (fill: Fill) => void }) {
  const { t } = useTranslation();
  const id = useId();
  const theme = useEditor((s) => s.doc.theme);
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
    </div>
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
