import { type CSSProperties, memo, useId } from 'react';
import type {
  Design,
  DesignElement,
  Fill,
  LineElement,
  ShapeElement,
  TextStyle,
  Theme,
} from '@/core/schema';
import { resolveColor, resolveFont } from '@/core/schema';
import { pointsToSvg, shapePoints } from '@/core/shapes';
import { fillToCss } from './fill';

/** The same artwork is rendered in the editor and in every thumbnail, in document units. */
export const PageArtwork = memo(function PageArtwork({
  design,
  pageIndex = 0,
  editingId,
  resolveSrc,
}: {
  design: Design;
  pageIndex?: number;
  editingId?: string | null;
  resolveSrc?: (source: string) => string | undefined;
}) {
  const page = design.pages[pageIndex];
  return (
    <div
      className="relative overflow-hidden"
      data-testid="page-artwork"
      style={{
        width: design.width,
        height: design.height,
        backgroundColor: 'white',
        ...fillToCss(page?.background, design.theme, resolveSrc),
      }}
    >
      {page?.elements
        .filter((e) => !e.hidden)
        .map((element) => (
          <ElementArtwork
            key={element.id}
            element={element}
            theme={design.theme}
            invisible={editingId === element.id}
            resolveSrc={resolveSrc}
          />
        ))}
    </div>
  );
});

export function elementFrame(
  element: Pick<DesignElement, 'x' | 'y' | 'width' | 'height' | 'rotation' | 'opacity'>,
): CSSProperties {
  return {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    transform: `rotate(${element.rotation}deg)`,
    transformOrigin: 'center',
    opacity: element.opacity,
  };
}

export function textCss(style: TextStyle, theme: Theme): CSSProperties {
  return {
    fontFamily: `${JSON.stringify(resolveFont(style.fontFamily, theme))}, sans-serif`,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.italic ? 'italic' : 'normal',
    color: resolveColor(style.color, theme),
    textAlign: style.align,
    lineHeight: style.lineHeight,
    letterSpacing: `${style.letterSpacing}em`,
    textTransform: style.textTransform,
    textDecoration:
      [style.underline ? 'underline' : '', style.strikethrough ? 'line-through' : '']
        .join(' ')
        .trim() || 'none',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    WebkitTextStroke: style.stroke
      ? `${style.stroke.width}px ${resolveColor(style.stroke.color, theme)}`
      : undefined,
    textShadow: style.shadow
      ? `${style.shadow.offsetX}px ${style.shadow.offsetY}px ${style.shadow.blur}px ${resolveColor(style.shadow.color, theme)}`
      : undefined,
  };
}

/** React's generated IDs can contain punctuation that is awkward inside `url(#...)`. */
function svgId(raw: string, prefix: string): string {
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

const ElementArtwork = memo(function ElementArtwork({
  element: e,
  theme,
  invisible,
  resolveSrc,
}: {
  element: DesignElement;
  theme: Theme;
  invisible?: boolean;
  resolveSrc?: (source: string) => string | undefined;
}) {
  const shadow = e.type === 'shape' || e.type === 'image' ? e.shadow : undefined;
  return (
    <div
      data-element-id={e.id}
      data-element-type={e.type}
      data-locked={e.locked || undefined}
      style={{
        ...elementFrame(e),
        visibility: invisible ? 'hidden' : undefined,
        filter: shadow
          ? `drop-shadow(${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${resolveColor(shadow.color, theme)})`
          : undefined,
      }}
    >
      {e.type === 'text' && (
        <div
          dir={e.direction ?? 'auto'}
          style={{
            ...textCss(e.style, theme),
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            justifyContent: { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[
              e.style.verticalAlign
            ],
          }}
        >
          <div>{e.text || '\u200b'}</div>
        </div>
      )}
      {e.type === 'shape' && <ShapeArtwork element={e} theme={theme} />}
      {e.type === 'line' && <LineArtwork element={e} theme={theme} />}
      {e.type === 'image' && resolveSrc?.(e.src) && (
        <img
          src={resolveSrc(e.src)}
          alt={e.alt ?? ''}
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: e.fit,
            borderRadius: e.radius,
            transform: `scale(${e.flipX ? -1 : 1}, ${e.flipY ? -1 : 1})`,
          }}
        />
      )}
    </div>
  );
});

function Gradient({ fill, id, theme }: { fill: Fill; id: string; theme: Theme }) {
  if (fill.type !== 'linear' && fill.type !== 'radial') return null;
  const stops = fill.stops.map((stop, i) => (
    <stop
      // biome-ignore lint/suspicious/noArrayIndexKey: Stops are stateless and position-ordered; duplicate colours and offsets are valid hard stops.
      key={i}
      offset={stop.offset}
      stopColor={resolveColor(stop.color, theme)}
    />
  ));
  if (fill.type === 'radial')
    return (
      <radialGradient id={id} cx={fill.cx} cy={fill.cy} r="0.7">
        {stops}
      </radialGradient>
    );
  const a = (fill.angle * Math.PI) / 180;
  return (
    <linearGradient
      id={id}
      x1={0.5 - Math.sin(a) / 2}
      y1={0.5 + Math.cos(a) / 2}
      x2={0.5 + Math.sin(a) / 2}
      y2={0.5 - Math.cos(a) / 2}
    >
      {stops}
    </linearGradient>
  );
}

function ShapeArtwork({ element: e, theme }: { element: ShapeElement; theme: Theme }) {
  const id = svgId(useId(), 'fill');
  const stroke = e.stroke?.width ?? 0;
  const inset = stroke / 2;
  const props = {
    fill: e.fill.type === 'solid' ? resolveColor(e.fill.color, theme) : `url(#${id})`,
    stroke: e.stroke ? resolveColor(e.stroke.color, theme) : 'none',
    strokeWidth: stroke,
    strokeDasharray:
      e.stroke?.dash === 'dashed'
        ? `${stroke * 4} ${stroke * 3}`
        : e.stroke?.dash === 'dotted'
          ? `${stroke} ${stroke * 2}`
          : undefined,
    strokeLinejoin: 'round' as const,
  };
  const points = shapePoints(e.shape, e.width, e.height, inset);
  return (
    <svg aria-hidden="true" width="100%" height="100%" viewBox={`0 0 ${e.width} ${e.height}`}>
      <defs>
        <Gradient fill={e.fill} id={id} theme={theme} />
      </defs>
      {e.shape === 'rect' && (
        <rect
          x={inset}
          y={inset}
          width={Math.max(0, e.width - stroke)}
          height={Math.max(0, e.height - stroke)}
          rx={e.radius ?? 0}
          {...props}
        />
      )}
      {e.shape === 'ellipse' && (
        <ellipse
          cx={e.width / 2}
          cy={e.height / 2}
          rx={Math.max(0, (e.width - stroke) / 2)}
          ry={Math.max(0, (e.height - stroke) / 2)}
          {...props}
        />
      )}
      {points && <polygon points={pointsToSvg(points)} {...props} />}
    </svg>
  );
}

function LineArtwork({ element: e, theme }: { element: LineElement; theme: Theme }) {
  const id = svgId(useId(), 'line');
  const color = resolveColor(e.stroke.color, theme);
  const marker = (cap: LineElement['startCap'], side: string) => (
    <marker
      id={`${id}-${side}`}
      viewBox="0 0 10 10"
      refX="5"
      refY="5"
      markerWidth="5"
      markerHeight="5"
      orient="auto-start-reverse"
    >
      {cap === 'arrow' && <path d="M 0 0 L 10 5 L 0 10 Z" fill={color} />}
      {cap === 'circle' && <circle cx="5" cy="5" r="4" fill={color} />}
      {cap === 'square' && <rect x="1" y="1" width="8" height="8" fill={color} />}
    </marker>
  );
  return (
    <div
      className="relative size-full"
      style={{ transform: `rotate(${e.rotation}deg)`, transformOrigin: 'center' }}
    >
      {/* Keep very thin lines easy to select without changing their saved geometry. */}
      <span
        aria-hidden="true"
        className="absolute start-0 end-0 top-1/2 -translate-y-1/2"
        style={{ height: Math.max(e.height, 24) }}
      />
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        viewBox={`0 0 ${e.width} ${e.height}`}
        style={{ overflow: 'visible', position: 'absolute', inset: 0 }}
      >
        <defs>
          {marker(e.startCap, 'start')}
          {marker(e.endCap, 'end')}
        </defs>
        <line
          x1="0"
          y1={e.height / 2}
          x2={e.width}
          y2={e.height / 2}
          stroke={color}
          strokeWidth={e.stroke.width}
          strokeLinecap="round"
          strokeDasharray={
            e.stroke.dash === 'dashed' ? `${e.stroke.width * 4} ${e.stroke.width * 3}` : undefined
          }
          markerStart={e.startCap !== 'none' ? `url(#${id}-start)` : undefined}
          markerEnd={e.endCap !== 'none' ? `url(#${id}-end)` : undefined}
        />
      </svg>
    </div>
  );
}
