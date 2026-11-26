import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resolveColor, type Theme } from '@/core/schema';
import { useEditorStore } from './EditorContext';

/** Keeps partially typed numbers local; only finite, in-range values reach the document. */
export function NumberField({
  label,
  value,
  onChange,
  min = -100_000,
  max = 100_000,
  step = 'any',
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number | 'any';
  suffix?: string;
}) {
  const id = useId();
  const store = useEditorStore();
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const display = Number(value.toFixed(2));
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
        {suffix && <span className="ms-auto opacity-70">{suffix}</span>}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={focused ? draft : display}
        onFocus={() => {
          setDraft(String(display));
          setFocused(true);
          store.getState().begin();
        }}
        onBlur={() => {
          setFocused(false);
          store.getState().commit();
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          const next = e.target.valueAsNumber;
          if (Number.isFinite(next) && next >= min && next <= max) onChange(next);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            store.getState().cancel();
            e.currentTarget.blur();
          }
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </div>
  );
}

export function ColorField({
  label,
  value,
  theme,
  onChange,
}: {
  label: string;
  value: string;
  theme: Theme;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const store = useEditorStore();
  const hex = resolveColor(value, theme).slice(0, 7);
  return (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <div className="flex items-center gap-2 rounded-md border bg-background px-1.5 py-1">
        <span className="font-mono text-muted-foreground text-xs">{hex}</span>
        <input
          id={id}
          type="color"
          value={hex}
          className="h-7 w-8 cursor-pointer border-0 bg-transparent p-0"
          onFocus={() => store.getState().begin()}
          onBlur={() => store.getState().commit()}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
