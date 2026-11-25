import type { CSSProperties } from 'react';
import type { Design } from '@/core/schema';
import { cn } from '@/lib/utils';
import { fillToCss } from '@/render/fill';

/**
 * Size that fits a `width × height` box inside its container (which must have
 * `container-type: size`), keeping the aspect ratio. Pure CSS, so it stays correct
 * at any container size without measuring.
 */
export function fitToContainer(width: number, height: number): CSSProperties {
  return {
    width: `min(100cqw, calc(100cqh * ${width / height}))`,
    aspectRatio: `${width} / ${height}`,
  };
}

/** Preview of a design's first page. Elements will appear here once the editor exists. */
export function DesignThumbnail({ design, className }: { design: Design; className?: string }) {
  const page = design.pages[0];
  return (
    <div
      aria-hidden="true"
      className={cn('flex size-full items-center justify-center [container-type:size]', className)}
    >
      <div
        className="rounded-[2px] bg-white shadow-sm ring-1 ring-black/10 dark:ring-white/10"
        style={{
          ...fitToContainer(design.width, design.height),
          ...fillToCss(page?.background, design.theme),
        }}
      />
    </div>
  );
}

/** A plain page outline in the brand colours, for size pickers. */
export function PageShape({
  width,
  height,
  className,
}: {
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block rounded-[3px] border border-primary/30 bg-linear-to-br from-primary/15 to-brand-2/15 transition-colors group-hover:from-primary/25 group-hover:to-brand-2/25',
        className,
      )}
      style={fitToContainer(width, height)}
    />
  );
}
