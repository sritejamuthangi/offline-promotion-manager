import { type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TextElement } from '@/core/schema';
import { elementFrame, textCss } from '@/render/PageArtwork';
import { useEditor, useEditorStore } from './EditorContext';

export function InlineTextEditor({
  element,
  zoom,
  canvas,
  onDone,
}: {
  element: TextElement;
  zoom: number;
  canvas: RefObject<HTMLDivElement | null>;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const store = useEditorStore();
  const theme = useEditor((s) => s.doc.theme);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [padding, setPadding] = useState(0);
  useLayoutEffect(() => {
    const field = ref.current;
    store.getState().begin();
    field?.focus({ preventScroll: true });
    field?.select();
  }, [store]);
  useLayoutEffect(() => {
    // Measure the real, browser-shaped text in the underlying artwork for vertical alignment.
    const frame = canvas.current?.querySelector<HTMLElement>(`[data-element-id="${element.id}"]`);
    const text = frame?.firstElementChild?.firstElementChild as HTMLElement | undefined;
    const extra = Math.max(0, element.height - (text?.offsetHeight ?? element.height));
    setPadding(
      element.style.verticalAlign === 'middle'
        ? extra / 2
        : element.style.verticalAlign === 'bottom'
          ? extra
          : 0,
    );
  }, [canvas, element]);
  return (
    <textarea
      ref={ref}
      aria-label={t('editor.editText')}
      dir={element.direction ?? 'auto'}
      value={element.text}
      spellCheck
      className="absolute resize-none overflow-hidden border-0 bg-transparent outline-violet-600"
      style={{
        ...elementFrame(element),
        ...textCss(element.style, theme),
        padding: 0,
        paddingTop: padding,
        outlineWidth: 1 / zoom,
        outlineStyle: 'solid',
        touchAction: 'auto',
        userSelect: 'text',
      }}
      onChange={(event) =>
        store.getState().updateSelected((e) => {
          if (e.type === 'text') e.text = event.target.value;
        })
      }
      onBlur={() => {
        store.getState().commit();
        onDone();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          store.getState().cancel();
          onDone();
        }
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    />
  );
}
