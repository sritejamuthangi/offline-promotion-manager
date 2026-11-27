import { useMemo } from 'react';
import { withBleed } from '@/core/print';
import type { Design } from '@/core/schema';
import { PageArtwork } from '@/render/PageArtwork';

/** Extend the bleed without changing any artwork inside the finished page. */
export function PrintArtwork({
  design,
  pageIndex,
  bleed,
  resolveSrc,
}: {
  design: Design;
  pageIndex: number;
  bleed: number;
  resolveSrc?: (source: string) => string | undefined;
}) {
  const extended = useMemo(() => withBleed(design, bleed), [design, bleed]);
  if (!(bleed > 0))
    return <PageArtwork design={design} pageIndex={pageIndex} resolveSrc={resolveSrc} />;
  // The ring reaches one pixel under the opaque page, so antialiased edges where the two
  // meet never let the white paper show through as a thin line, even at 72 DPI.
  const underlap = Math.min(1, design.width / 4, design.height / 4);
  const inner = bleed + underlap;
  const right = bleed + design.width - underlap;
  const bottom = bleed + design.height - underlap;
  return (
    <div style={{ position: 'relative', width: extended.width, height: extended.height }}>
      <div
        aria-hidden="true"
        style={{
          // The original artwork paints over the edge of this ring.
          clipPath: `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${inner}px ${inner}px, ${right}px ${inner}px, ${right}px ${bottom}px, ${inner}px ${bottom}px, ${inner}px ${inner}px)`,
        }}
      >
        <PageArtwork design={extended} pageIndex={pageIndex} resolveSrc={resolveSrc} />
      </div>
      <div style={{ position: 'absolute', left: bleed, top: bleed }}>
        <PageArtwork design={design} pageIndex={pageIndex} resolveSrc={resolveSrc} />
      </div>
    </div>
  );
}
