import { Maximize, Minus, Plus } from 'lucide-react';
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  angleBetween,
  boundingRect,
  boxFromLine,
  centerOf,
  distance,
  HANDLES,
  type HandleName,
  lineEndpoints,
  type Point,
  type Rect,
  rectFromPoints,
  rectsIntersect,
  resizeBox,
  rotateBoxes,
  rotatePoint,
  scaleBoxes,
  snapAngle,
  unionRects,
} from '@/core/geometry';
import type { DesignElement } from '@/core/schema';
import {
  collectSnapTargets,
  NO_GUIDES,
  type SnapGuides,
  type SnapTargets,
  snapAxis,
  snapRect,
} from '@/core/snapping';
import { formatSize } from '@/core/units';
import { useElementSize } from '@/lib/hooks';
import { PageArtwork } from '@/render/PageArtwork';
import { useEditor, useEditorStore } from './EditorContext';
import { editableElements, pageElements } from './editorStore';
import { InlineTextEditor } from './InlineTextEditor';
import { SelectionOverlay } from './SelectionOverlay';
import { fitView, pagePoint, type View, zoomView } from './viewport';

type Transform = {
  bases: DesignElement[];
  bounds: Rect;
  targets: SnapTargets;
  start: Point;
  moved: boolean;
};
type Gesture =
  | ({ kind: 'move' } & Transform)
  | ({ kind: 'resize'; handle: HandleName; grab: Point } & Transform)
  | ({ kind: 'rotate'; pivot: Point; angle: number } & Transform)
  | ({ kind: 'endpoint'; end: 'start' | 'end'; grab: Point } & Transform)
  | { kind: 'marquee'; start: Point; before: string[] }
  | { kind: 'pan'; screen: Point; view: View }
  | { kind: 'pinch'; screen: Point; distance: number; view: View };

export interface CanvasOptions {
  hand: boolean;
  space: boolean;
  multi: boolean;
  snapping: boolean;
  editing: string | null;
  setEditing: (id: string | null) => void;
}

export function EditorCanvas({ hand, space, multi, snapping, editing, setEditing }: CanvasOptions) {
  const { t, i18n } = useTranslation();
  const store = useEditorStore();
  const doc = useEditor((s) => s.doc);
  const pageIndex = useEditor((s) => s.pageIndex);
  const selection = useEditor((s) => s.selection);
  const selected = (doc.pages[pageIndex]?.elements ?? []).filter(
    (e) => selection.includes(e.id) && !e.hidden,
  );
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  const [view, setView] = useState<View>({ x: 0, y: 0, zoom: 1 });
  const viewRef = useRef(view);
  const [autoFit, setAutoFit] = useState(true);
  const [guides, setGuides] = useState<SnapGuides>(NO_GUIDES);
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinching = useRef(false);

  const changeView = useCallback((next: View) => {
    viewRef.current = next;
    setView(next);
  }, []);
  const fit = useCallback(() => {
    changeView(fitView(size, { width: doc.width, height: doc.height }));
    setAutoFit(true);
  }, [size, doc.width, doc.height, changeView]);
  useEffect(() => {
    if (autoFit && size.width && size.height)
      changeView(fitView(size, { width: doc.width, height: doc.height }));
  }, [size, doc.width, doc.height, autoFit, changeView]);

  const screenPoint = (e: { clientX: number; clientY: number }): Point => {
    const rect = ref.current?.getBoundingClientRect();
    return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
  };

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const wheel = (e: WheelEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('textarea,button,select')) return;
      e.preventDefault();
      const current = viewRef.current;
      const bounds = node.getBoundingClientRect();
      setAutoFit(false);
      if (e.ctrlKey || e.metaKey) {
        changeView(
          zoomView(
            current,
            { x: e.clientX - bounds.left, y: e.clientY - bounds.top },
            current.zoom * Math.exp(-e.deltaY * 0.008),
          ),
        );
      } else {
        const multiplier = e.deltaMode === 1 ? 16 : 1;
        changeView({
          ...current,
          x: current.x - e.deltaX * multiplier,
          y: current.y - e.deltaY * multiplier,
        });
      }
    };
    node.addEventListener('wheel', wheel, { passive: false });
    return () => node.removeEventListener('wheel', wheel);
  }, [changeView]);

  const cancel = useCallback(() => {
    store.getState().cancel();
    gesture.current = null;
    setGuides(NO_GUIDES);
    setMarquee(null);
  }, [store]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gesture.current) {
        e.preventDefault();
        cancel();
      }
    };
    const blur = () => {
      if (gesture.current) cancel();
      pointers.current.clear();
      pinching.current = false;
    };
    window.addEventListener('keydown', key);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('blur', blur);
    };
  }, [cancel]);

  const down = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('textarea,[data-canvas-controls]')) return;
    if (event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    if (editing) {
      store.getState().commit();
      setEditing(null);
    }
    ref.current?.focus({ preventScroll: true });
    const screen = screenPoint(event);
    pointers.current.set(event.pointerId, screen);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size === 2) {
      cancel();
      pinching.current = true;
      const [a, b] = [...pointers.current.values()];
      if (a && b)
        gesture.current = {
          kind: 'pinch',
          screen: centerOf(rectFromPoints(a, b)),
          distance: Math.max(1, distance(a, b)),
          view: viewRef.current,
        };
      return;
    }
    if (pinching.current) return;
    const current = viewRef.current;
    const point = pagePoint(screen, current);
    if (hand || space || event.button === 1) {
      gesture.current = { kind: 'pan', screen, view: current };
      setAutoFit(false);
      return;
    }
    const handle = target.closest<HTMLElement>('[data-resize]')?.dataset.resize as
      | HandleName
      | undefined;
    const rotate = target.closest('[data-rotate]');
    const endpoint = target.closest<HTMLElement>('[data-endpoint]')?.dataset.endpoint as
      | 'start'
      | 'end'
      | undefined;
    const id = target.closest<HTMLElement>('[data-element-id]')?.dataset.elementId;
    const additive = event.shiftKey || multi;
    if (!handle && !rotate && !endpoint) {
      if (id) {
        const previous = store.getState().selection;
        if (additive) {
          const included = previous.includes(id);
          store.getState().select(included ? previous.filter((i) => i !== id) : [...previous, id]);
          if (included) return;
        } else if (!previous.includes(id)) store.getState().select([id]);
      } else {
        const before = additive ? [...store.getState().selection] : [];
        store.getState().select(before);
        gesture.current = { kind: 'marquee', start: point, before };
        return;
      }
    }
    const bases = editableElements(store.getState());
    const bounds = unionRects(bases.map(boundingRect));
    if (!bases.length || !bounds) return;
    const ids = new Set(bases.map((e) => e.id));
    const targets = collectSnapTargets(
      doc,
      pageElements(store.getState())
        .filter((e) => !ids.has(e.id) && !e.hidden)
        .map(boundingRect),
    );
    const common = { bases, bounds, targets, start: point, moved: false };
    store.getState().begin();
    if (handle) {
      const box = bases.length === 1 && bases[0] ? bases[0] : { ...bounds, rotation: 0 };
      const direction = HANDLES[handle];
      const actual = rotatePoint(
        {
          x: box.x + ((direction.x + 1) * box.width) / 2,
          y: box.y + ((direction.y + 1) * box.height) / 2,
        },
        centerOf(box),
        box.rotation,
      );
      gesture.current = {
        ...common,
        kind: 'resize',
        handle,
        grab: { x: point.x - actual.x, y: point.y - actual.y },
      };
    } else if (rotate) {
      const pivot = bases.length === 1 && bases[0] ? centerOf(bases[0]) : centerOf(bounds);
      gesture.current = { ...common, kind: 'rotate', pivot, angle: angleBetween(pivot, point) };
    } else if (endpoint && bases[0]) {
      const actual = lineEndpoints(bases[0])[endpoint];
      gesture.current = {
        ...common,
        kind: 'endpoint',
        end: endpoint,
        grab: { x: point.x - actual.x, y: point.y - actual.y },
      };
    } else gesture.current = { ...common, kind: 'move' };
  };

  const move = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const screen = screenPoint(event);
    pointers.current.set(event.pointerId, screen);
    const g = gesture.current;
    if (!g) return;
    if (g.kind === 'pinch') {
      const [a, b] = [...pointers.current.values()];
      if (!a || !b) return;
      const middle = centerOf(rectFromPoints(a, b));
      const next = zoomView(g.view, g.screen, (g.view.zoom * distance(a, b)) / g.distance);
      changeView({ ...next, x: next.x + middle.x - g.screen.x, y: next.y + middle.y - g.screen.y });
      setAutoFit(false);
      return;
    }
    if (g.kind === 'pan') {
      changeView({
        ...g.view,
        x: g.view.x + screen.x - g.screen.x,
        y: g.view.y + screen.y - g.screen.y,
      });
      return;
    }
    const point = pagePoint(screen, viewRef.current);
    if (g.kind === 'marquee') {
      const rect = rectFromPoints(g.start, point);
      setMarquee(rect);
      const hits = pageElements(store.getState()).filter(
        (e) => !e.locked && !e.hidden && rectsIntersect(rect, boundingRect(e)),
      );
      store.getState().select([...g.before, ...hits.map((e) => e.id)]);
      return;
    }
    if (!g.moved && distance(g.start, point) * viewRef.current.zoom < 2) return;
    g.moved = true;
    let boxes = g.bases.map((e) => ({
      x: e.x,
      y: e.y,
      width: e.width,
      height: e.height,
      rotation: e.rotation,
    }));
    let fontScale = 1;
    let nextGuides: SnapGuides = NO_GUIDES;
    const threshold = 6 / viewRef.current.zoom;
    const snap = snapping && !event.altKey;
    const first = g.bases[0];
    if (!first) return;
    if (g.kind === 'move') {
      let dx = point.x - g.start.x;
      let dy = point.y - g.start.y;
      const horizontal = Math.abs(dx) >= Math.abs(dy);
      if (event.shiftKey) {
        if (horizontal) dy = 0;
        else dx = 0;
      }
      if (snap) {
        const result = snapRect(
          { ...g.bounds, x: g.bounds.x + dx, y: g.bounds.y + dy },
          g.targets,
          threshold,
        );
        if (!event.shiftKey || horizontal) {
          dx += result.dx;
          nextGuides = { ...nextGuides, x: result.guides.x };
        }
        if (!event.shiftKey || !horizontal) {
          dy += result.dy;
          nextGuides = { ...nextGuides, y: result.guides.y };
        }
      }
      boxes = boxes.map((b) => ({ ...b, x: b.x + dx, y: b.y + dy }));
    } else if (g.kind === 'resize') {
      const handle = HANDLES[g.handle];
      let pointer = { x: point.x - g.grab.x, y: point.y - g.grab.y };
      if (g.bases.length === 1) {
        if (snap && !event.shiftKey && first.rotation === 0) {
          const x = handle.x ? snapAxis([pointer.x], g.targets.x, threshold) : null;
          const y = handle.y ? snapAxis([pointer.y], g.targets.y, threshold) : null;
          pointer = { x: pointer.x + (x?.offset ?? 0), y: pointer.y + (y?.offset ?? 0) };
          nextGuides = { x: x?.lines ?? [], y: y?.lines ?? [] };
        }
        boxes = [
          resizeBox(first, handle, pointer, {
            keepAspect: event.shiftKey,
            fromCenter: event.altKey,
            minSize: 1,
          }),
        ];
        if (event.shiftKey) fontScale = (boxes[0]?.width ?? first.width) / first.width;
      } else {
        const scaled = scaleBoxes(
          g.bases,
          g.bounds,
          handle,
          pointer,
          Math.max(...g.bases.map((e) => 1 / Math.min(e.width, e.height))),
        );
        boxes = scaled.boxes;
        fontScale = scaled.scale;
      }
    } else if (g.kind === 'rotate') {
      const offset = g.bases.length === 1 ? first.rotation : 0;
      const delta = angleBetween(g.pivot, point) - g.angle;
      const angle = snapAngle(
        offset + delta,
        event.shiftKey ? { step: 15 } : { tolerance: event.altKey ? 0 : 3 },
      );
      boxes = rotateBoxes(g.bases, g.pivot, angle - offset);
    } else if (g.kind === 'endpoint') {
      const endpoints = lineEndpoints(first);
      let pointer = { x: point.x - g.grab.x, y: point.y - g.grab.y };
      if (event.shiftKey) {
        const anchor = endpoints[g.end === 'start' ? 'end' : 'start'];
        const angle = (snapAngle(angleBetween(anchor, pointer), { step: 15 }) * Math.PI) / 180;
        const length = distance(anchor, pointer);
        pointer = {
          x: anchor.x + length * Math.cos(angle),
          y: anchor.y + length * Math.sin(angle),
        };
      }
      endpoints[g.end] = pointer;
      boxes = [boxFromLine(endpoints.start, endpoints.end, first.height)];
    }
    const byId = new Map(g.bases.map((e, i) => [e.id, { box: boxes[i], original: e }]));
    store.getState().edit((draft) => {
      for (const element of draft.pages[pageIndex]?.elements ?? []) {
        const change = byId.get(element.id);
        if (!change?.box) continue;
        Object.assign(element, change.box);
        if (element.type === 'text' && change.original.type === 'text')
          element.style.fontSize = change.original.style.fontSize * fontScale;
      }
    });
    setGuides(nextGuides);
  };

  const up = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    if (pinching.current) {
      gesture.current = null;
      if (!pointers.current.size) pinching.current = false;
    } else {
      store.getState().commit();
      gesture.current = null;
    }
    setGuides(NO_GUIDES);
    setMarquee(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const editingElement = pageElements(store.getState()).find((e) => e.id === editing);
  const beginEdit = (id: string) => {
    const element = pageElements(store.getState()).find((e) => e.id === id);
    if (element?.type !== 'text' || element.locked || element.hidden) return;
    store.getState().commit();
    store.getState().select([id]);
    store.getState().begin();
    setEditing(id);
  };
  const zoom = (factor: number) => {
    changeView(
      zoomView(
        viewRef.current,
        { x: size.width / 2, y: size.height / 2 },
        viewRef.current.zoom * factor,
      ),
    );
    setAutoFit(false);
  };

  return (
    <div className="relative min-h-0 min-w-0 flex-1">
      <div
        ref={ref}
        data-testid="editor-canvas"
        role="application"
        aria-label={t('editor.canvas')}
        aria-describedby="canvas-help"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: This drawing application owns keyboard selection, nudging and editing.
        tabIndex={0}
        className="absolute inset-0 touch-none overflow-hidden bg-canvas outline-none"
        style={{ cursor: hand || space ? 'grab' : 'default' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={(event) => {
          pointers.current.delete(event.pointerId);
          cancel();
          pinching.current = pointers.current.size > 0;
        }}
        onLostPointerCapture={(event) => {
          if (pointers.current.has(event.pointerId)) {
            pointers.current.delete(event.pointerId);
            cancel();
          }
        }}
        onDoubleClick={(event) => {
          // Pointer capture retargets clicks to the canvas; recover the artwork under the cursor.
          const id = document
            .elementFromPoint(event.clientX, event.clientY)
            ?.closest<HTMLElement>('[data-element-id]')?.dataset.elementId;
          if (id && !hand) beginEdit(id);
        }}
      >
        <div
          data-testid="editor-page"
          className="absolute origin-top-left shadow-xl"
          style={{
            width: doc.width,
            height: doc.height,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          }}
        >
          <PageArtwork design={doc} pageIndex={pageIndex} editingId={editing} />
          {!editing && <SelectionOverlay elements={selected} zoom={view.zoom} />}
          {marquee && (
            <div
              className="pointer-events-none absolute border border-violet-500 bg-violet-500/15"
              style={{
                left: marquee.x,
                top: marquee.y,
                width: marquee.width,
                height: marquee.height,
                borderWidth: 1 / view.zoom,
              }}
            />
          )}
          {guides.x.map((x) => (
            <div
              key={x}
              data-testid="snap-guide"
              className="pointer-events-none absolute top-0 bg-fuchsia-500"
              style={{ left: x, width: 1 / view.zoom, height: doc.height }}
            />
          ))}
          {guides.y.map((y) => (
            <div
              key={y}
              data-testid="snap-guide"
              className="pointer-events-none absolute start-0 bg-fuchsia-500"
              style={{ top: y, height: 1 / view.zoom, width: doc.width }}
            />
          ))}
          {editingElement?.type === 'text' && (
            <InlineTextEditor
              element={editingElement}
              zoom={view.zoom}
              canvas={ref}
              onDone={() => setEditing(null)}
            />
          )}
        </div>
      </div>
      <div
        data-canvas-controls
        className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 p-3"
      >
        <span className="rounded-md bg-background/90 px-2 py-1 text-muted-foreground text-xs shadow-sm">
          {formatSize(doc.width, doc.height, doc.unit, i18n.language)}
        </span>
        <div className="pointer-events-auto flex items-center rounded-lg border bg-background p-1 shadow-sm">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t('editor.zoomOut')}
            onClick={() => zoom(1 / 1.2)}
          >
            <Minus />
          </Button>
          <span className="min-w-14 text-center text-xs tabular-nums" data-testid="zoom-level">
            {(view.zoom * 100).toFixed(view.zoom < 0.01 ? 2 : 0)}%
          </span>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t('editor.zoomIn')}
            onClick={() => zoom(1.2)}
          >
            <Plus />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t('editor.fit')}
            title={t('editor.fit')}
            onClick={fit}
          >
            <Maximize />
          </Button>
        </div>
      </div>
      <p id="canvas-help" className="sr-only">
        {t('editor.canvasHelp')}
      </p>
    </div>
  );
}
