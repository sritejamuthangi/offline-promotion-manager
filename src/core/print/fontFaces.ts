import { type CodeRange, inRanges } from '../unicode';
import type { TextRun } from './content';

/** One `@font-face` rule of the document, reduced to what font matching needs. */
export interface FaceInfo {
  family: string;
  /** `normal` or `italic`. */
  style: string;
  /** The face's `unicode-range`; empty when it covers everything. */
  ranges: readonly CodeRange[];
}

function covers(face: FaceInfo, point: number): boolean {
  return !face.ranges.length || inRanges(point, face.ranges);
}

/**
 * The font faces an export needs, as the browser would choose them: for each character,
 * the first family in its text's font stack with a face covering it. Faces of a text's
 * chosen font are required (`true`); fallback faces are optional (`false`), so an export
 * can still be made offline with system fonts drawing a writing system not yet downloaded.
 */
export function selectFaces<F extends FaceInfo>(
  faces: readonly F[],
  runs: readonly TextRun[],
): Map<F, boolean> {
  const byFamily = new Map<string, F[]>();
  for (const face of faces) {
    const list = byFamily.get(face.family);
    if (list) list.push(face);
    else byFamily.set(face.family, [face]);
  }
  const needed = new Map<F, boolean>();
  for (const run of runs) {
    for (const point of run.codePoints) {
      for (const family of run.families) {
        const all = byFamily.get(family);
        if (!all) continue;
        // Italic text uses italic faces when the family has them; browsers slant the rest.
        const italic = run.italic ? all.filter((face) => face.style === 'italic') : [];
        const styled = italic.length ? italic : all.filter((face) => face.style !== 'italic');
        const covering = styled.filter((face) => covers(face, point));
        if (!covering.length) continue;
        const required = run.primary.includes(family);
        for (const face of covering) needed.set(face, needed.get(face) === true || required);
        break;
      }
    }
  }
  return needed;
}
