import { RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  boundingRect,
  HANDLES,
  type HandleName,
  isCornerHandle,
  lineEndpoints,
  unionRects,
} from '@/core/geometry';
import type { DesignElement } from '@/core/schema';

export function SelectionOverlay({ elements, zoom }: { elements: DesignElement[]; zoom: number }) {
  const { t } = useTranslation();
  const movable = elements.filter((e) => !e.locked);
  const bounds = unionRects(movable.map(boundingRect));
  const single = movable.length === 1 ? movable[0] : undefined;
  const box = single ?? (bounds ? { ...bounds, rotation: 0 } : undefined);
  const handleStyle = {
    width: 24 / zoom,
    height: 24 / zoom,
    transform: 'translate(-50%, -50%)',
  };
  return (
    <>
      {elements.length > 1 || !movable.length
        ? elements.map((e) => (
            <div
              key={e.id}
              className="pointer-events-none absolute border border-violet-500/60"
              style={{
                left: e.x,
                top: e.y,
                width: e.width,
                height: e.height,
                transform: `rotate(${e.rotation}deg)`,
                borderWidth: 1 / zoom,
              }}
            />
          ))
        : null}
      {box && (
        <div
          data-testid="selection-outline"
          className="pointer-events-none absolute border border-violet-600"
          style={{
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
            transform: `rotate(${box.rotation}deg)`,
            borderWidth: 1 / zoom,
          }}
        >
          {single?.type !== 'line' &&
            (Object.keys(HANDLES) as HandleName[])
              .filter((h) => single || isCornerHandle(HANDLES[h]))
              .map((handle) => (
                <button
                  key={handle}
                  type="button"
                  data-resize={handle}
                  aria-label={t('editor.resizeHandle', { handle: t(`editor.handles.${handle}`) })}
                  className="pointer-events-auto absolute flex touch-none items-center justify-center outline-none focus-visible:bg-violet-400/30"
                  style={{
                    ...handleStyle,
                    left: `${(HANDLES[handle].x + 1) * 50}%`,
                    top: `${(HANDLES[handle].y + 1) * 50}%`,
                    cursor: `${handle}-resize`,
                  }}
                >
                  <span
                    className="rounded-[1px] border border-violet-600 bg-white"
                    style={{ width: 9 / zoom, height: 9 / zoom, borderWidth: 1 / zoom }}
                  />
                </button>
              ))}
          <span
            className="absolute bg-violet-600"
            style={{ left: '50%', top: -28 / zoom, height: 28 / zoom, width: 1 / zoom }}
          />
          <button
            type="button"
            data-rotate="true"
            aria-label={t('editor.rotate')}
            className="pointer-events-auto absolute flex touch-none items-center justify-center rounded-full border border-violet-600 bg-white text-violet-700 shadow-sm"
            style={{
              ...handleStyle,
              left: '50%',
              top: -30 / zoom,
              borderWidth: 1 / zoom,
              cursor: 'grab',
            }}
          >
            <RotateCw style={{ width: 13 / zoom, height: 13 / zoom }} />
          </button>
        </div>
      )}
      {single?.type === 'line' &&
        (['start', 'end'] as const).map((end) => {
          const point = lineEndpoints(single)[end];
          return (
            <button
              key={end}
              type="button"
              data-endpoint={end}
              aria-label={t(end === 'start' ? 'editor.lineStart' : 'editor.lineEnd')}
              className="absolute flex touch-none items-center justify-center"
              style={{ ...handleStyle, left: point.x, top: point.y, cursor: 'move' }}
            >
              <span
                className="rounded-full border border-violet-600 bg-white"
                style={{ width: 10 / zoom, height: 10 / zoom, borderWidth: 1 / zoom }}
              />
            </button>
          );
        })}
    </>
  );
}
