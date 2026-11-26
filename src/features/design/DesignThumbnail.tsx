import { type CSSProperties, useRef } from 'react';
import type { Design } from '@/core/schema';
import { useElementSize } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { PageArtwork } from '@/render/PageArtwork';

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

/** Live preview of the exact same artwork as the editor, scaled to fit its card. */
export function DesignThumbnail({ design, className }: { design: Design; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  const scale = Math.min(size.width / design.width, size.height / design.height);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('pointer-events-none relative size-full', className)}
    >
      <div
        className="absolute origin-top-left bg-white shadow-sm ring-1 ring-black/10 dark:ring-white/10"
        style={{
          width: design.width,
          height: design.height,
          left: (size.width - design.width * scale) / 2,
          top: (size.height - design.height * scale) / 2,
          transform: `scale(${scale})`,
        }}
      >
        <PageArtwork design={design} />
      </div>
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
