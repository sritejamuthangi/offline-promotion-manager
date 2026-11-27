import type { Design, DesignElement } from '../schema';

/** Edges this close to the trim edge count as touching it, px. */
const EDGE = 0.5;

/**
 * Photos and plain colour blocks that touch the trim edge are pulled out to the bleed edge.
 * Text, outlines and turned elements keep their exact geometry.
 */
function extendable(element: DesignElement): boolean {
  const turn = ((element.rotation % 360) + 360) % 360;
  if (turn > 0.01 && turn < 359.99) return false;
  if (element.type === 'image') return true;
  return (
    element.type === 'shape' &&
    element.shape === 'rect' &&
    !(element.stroke && element.stroke.width > 0)
  );
}

function extend(element: DesignElement, width: number, height: number, bleed: number) {
  let left = element.x;
  let top = element.y;
  let right = element.x + element.width;
  let bottom = element.y + element.height;
  if (extendable(element)) {
    if (left <= EDGE && left > -bleed && right > EDGE) left = -bleed;
    if (right >= width - EDGE && right < width + bleed && left < width - EDGE)
      right = width + bleed;
    if (top <= EDGE && top > -bleed && bottom > EDGE) top = -bleed;
    if (bottom >= height - EDGE && bottom < height + bleed && top < height - EDGE)
      bottom = height + bleed;
  }
  return {
    ...element,
    x: left + bleed,
    y: top + bleed,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * A copy of the design whose pages include the bleed: every element moves by `bleed`, the
 * page background covers the larger area, and edge-to-edge artwork runs into the bleed, so
 * no white slivers show after trimming. Only its outer ring is used by PrintArtwork;
 * the original artwork fills the trim box to preserve photo crops and gradients.
 */
export function withBleed(design: Design, bleed: number): Design {
  if (!(bleed > 0)) return design;
  return {
    ...design,
    width: design.width + 2 * bleed,
    height: design.height + 2 * bleed,
    pages: design.pages.map((page) => ({
      ...page,
      elements: page.elements.map(
        (element) => extend(element, design.width, design.height, bleed) as DesignElement,
      ),
    })),
  };
}
