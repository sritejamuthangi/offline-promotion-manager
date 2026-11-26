import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, LockOpen } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEditor, useEditorStore } from './EditorContext';
import { elementLabel } from './elementLabel';

export function LayersPanel({ multi }: { multi: boolean }) {
  const { t } = useTranslation();
  const store = useEditorStore();
  const doc = useEditor((s) => s.doc);
  const pageIndex = useEditor((s) => s.pageIndex);
  const selection = useEditor((s) => s.selection);
  const dragging = useRef<string | null>(null);
  const elements = [...(doc.pages[pageIndex]?.elements ?? [])].reverse();

  return (
    <section className="p-3" aria-label={t('editor.layers')}>
      <p className="mb-3 px-1 text-muted-foreground text-xs">{t('editor.layersHint')}</p>
      {!elements.length && <p className="px-1 py-4 text-sm">{t('editor.noLayers')}</p>}
      <ul className="space-y-1">
        {elements.map((e) => {
          const label = elementLabel(e, t);
          return (
            <li
              key={e.id}
              data-layer-id={e.id}
              draggable={!e.locked}
              onDragStart={(event) => {
                dragging.current = e.id;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', e.id);
              }}
              onDragEnd={() => {
                dragging.current = null;
              }}
              onDragOver={(event) => {
                if (dragging.current) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const source = dragging.current;
                dragging.current = null;
                if (!source || source === e.id) return;
                store.getState().edit((d) => {
                  const page = d.pages[pageIndex];
                  if (!page) return;
                  const from = page.elements.findIndex((item) => item.id === source);
                  if (from < 0) return;
                  const to = page.elements.findIndex((item) => item.id === e.id);
                  const [item] = page.elements.splice(from, 1);
                  if (!item) return;
                  page.elements.splice(to, 0, item);
                });
              }}
              className={cn(
                'flex items-center gap-1 rounded-lg border p-1',
                selection.includes(e.id)
                  ? 'border-primary/50 bg-accent'
                  : 'border-transparent hover:bg-muted',
              )}
            >
              <button
                type="button"
                className="min-w-0 flex-1 rounded-md px-2 py-2 text-start text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t('editor.selectLayer', { name: label })}
                aria-pressed={selection.includes(e.id)}
                onClick={(event) => {
                  store.getState().commit();
                  if (event.shiftKey || multi)
                    store
                      .getState()
                      .select(
                        selection.includes(e.id)
                          ? selection.filter((id) => id !== e.id)
                          : [...selection, e.id],
                      );
                  else store.getState().select([e.id]);
                }}
              >
                <span className={cn('block truncate', e.hidden && 'opacity-40')}>{label}</span>
              </button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t(e.hidden ? 'editor.showLayer' : 'editor.hideLayer', { name: label })}
                onClick={() =>
                  store.getState().edit((d) => {
                    const item = d.pages[pageIndex]?.elements.find((item) => item.id === e.id);
                    if (item) item.hidden = !item.hidden;
                  })
                }
              >
                {e.hidden ? <EyeOff /> : <Eye />}
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t(e.locked ? 'editor.unlockLayer' : 'editor.lockLayer', {
                  name: label,
                })}
                onClick={() =>
                  store.getState().edit((d) => {
                    const item = d.pages[pageIndex]?.elements.find((item) => item.id === e.id);
                    if (item) item.locked = !item.locked;
                  })
                }
              >
                {e.locked ? <Lock /> : <LockOpen />}
              </Button>
            </li>
          );
        })}
      </ul>
      {selection.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
          <Button size="sm" variant="outline" onClick={() => store.getState().reorder('forward')}>
            <ChevronUp />
            {t('editor.layerMove.forward')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => store.getState().reorder('backward')}>
            <ChevronDown />
            {t('editor.layerMove.backward')}
          </Button>
        </div>
      )}
    </section>
  );
}
