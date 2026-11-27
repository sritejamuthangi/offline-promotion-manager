import { memo } from 'react';
import { MARK_STROKE, type Placement, type PrintPlan, type PrintSheet } from '@/core/print';
import type { Design } from '@/core/schema';
import { toPx } from '@/core/units';
import { PrintArtwork } from './PrintArtwork';

/** A length for print CSS in millimetres, the unit `@page` uses, so sheets match pages. */
export function cssMm(px: number): string {
  return `${((px * 25.4) / 96).toFixed(4)}mm`;
}

function PlacedArtwork({
  design,
  placement: p,
  bleed,
}: {
  design: Design;
  placement: Placement;
  bleed: number;
}) {
  const offset = bleed * p.scale;
  return (
    <div
      data-print-placement=""
      style={{
        position: 'absolute',
        left: p.clip.x,
        top: p.clip.y,
        width: p.clip.width,
        height: p.clip.height,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: p.x - offset - p.clip.x,
          top: p.y - offset - p.clip.y,
          width: design.width + 2 * bleed,
          height: design.height + 2 * bleed,
          transformOrigin: '0 0',
          // A quarter turn clockwise moves the artwork left of its box; shift it back.
          transform: p.rotated
            ? `translateX(${(design.height + 2 * bleed) * p.scale}px) rotate(90deg) scale(${p.scale})`
            : `scale(${p.scale})`,
        }}
      >
        <PrintArtwork design={design} pageIndex={p.pageIndex} bleed={bleed} />
      </div>
    </div>
  );
}

/**
 * One sheet of paper: placed designs, crop marks and an optional label in the bottom
 * margin. The same component prints and previews, so the preview shows the real output.
 */
export const PrintSheetView = memo(function PrintSheetView({
  design,
  plan,
  sheet,
  label,
  preview = false,
}: {
  /** Original design; bleed is added by the artwork renderer. */
  design: Design;
  plan: PrintPlan;
  sheet: PrintSheet;
  label?: string;
  /** On screen, hairline marks stay one pixel wide however small the preview is. */
  preview?: boolean;
}) {
  const { width, height } = plan.sheet;
  // Labels sit just below the artwork, in the border with the cut marks.
  const clip = sheet.placements[0]?.clip;
  const labelTop = clip ? clip.y + clip.height : height;
  const labelBand = Math.min(height - labelTop, toPx(10, 'mm'));
  return (
    <div
      className="opm-print-sheet"
      data-print-sheet=""
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        width: preview ? width : cssMm(width),
        height: preview ? height : cssMm(height),
      }}
    >
      {sheet.placements.map((placement, index) => (
        <PlacedArtwork
          // biome-ignore lint/suspicious/noArrayIndexKey: Placements are positional and never reorder.
          key={index}
          design={design}
          placement={placement}
          bleed={plan.bleed}
        />
      ))}
      {sheet.marks.length > 0 && (
        <svg
          aria-hidden="true"
          data-print-marks={sheet.marks.length}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: 'absolute', left: 0, top: 0 }}
        >
          <g stroke="#000000" strokeWidth={preview ? 1 : MARK_STROKE} fill="none">
            {sheet.marks.map((mark, index) => (
              <line
                // biome-ignore lint/suspicious/noArrayIndexKey: Marks are positional and never reorder.
                key={index}
                x1={mark.x1}
                y1={mark.y1}
                x2={mark.x2}
                y2={mark.y2}
                vectorEffect={preview ? 'non-scaling-stroke' : undefined}
              />
            ))}
          </g>
        </svg>
      )}
      {label && labelBand > toPx(4, 'mm') && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: labelTop,
            height: labelBand,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Inter Variable", Inter, sans-serif',
            fontSize: toPx(7, 'pt'),
            lineHeight: 1,
            color: '#52525b',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
});
