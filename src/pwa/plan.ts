import { FONTS } from '@/core/fonts';
import { FONTS_MANIFEST } from './constants';

export interface OfflinePlan {
  /** Saved when the app is installed: everything needed to start and edit offline. */
  precache: string[];
  /** Writing-system font files, saved when first used or on request. */
  fonts: string[];
}

/** File-name prefixes of the design fonts, e.g. `inter-` or `bebas-neue-`. */
const DESIGN_FONT_PREFIXES = FONTS.filter((font) => font.bundled && !font.script).map(
  (font) => `${font.family.toLowerCase().replace(/\s+/g, '-')}-`,
);

const name = (path: string) => path.slice(path.lastIndexOf('/') + 1);

/**
 * Splits the files of a build (paths relative to the output folder) into what the service
 * worker saves when installed, and the writing-system fonts it saves on demand. Source maps,
 * public pages, older font formats and the notices file stay online-only.
 */
export function planOffline(files: readonly string[]): OfflinePlan {
  const precache: string[] = [];
  const fonts: string[] = [];
  for (const file of files) {
    if (file.startsWith('assets/') && file.endsWith('.woff2')) {
      if (DESIGN_FONT_PREFIXES.some((prefix) => name(file).startsWith(prefix))) precache.push(file);
      else fonts.push(file);
    } else if (
      file === 'index.html' ||
      file === 'editor.html' ||
      file === 'favicon.svg' ||
      file === 'manifest.webmanifest' ||
      file === FONTS_MANIFEST ||
      /^assets\/[^/]+\.(?:js|css)$/.test(file) ||
      /^icons\/[^/]+\.png$/.test(file)
    ) {
      precache.push(file);
    }
  }
  return { precache: precache.sort(), fonts: fonts.sort() };
}
