/** Cache Storage names shared by the service worker and the app. */
export const APP_CACHE_PREFIX = 'opm-app-';
/** Writing-system font files, kept across app versions because their names include a hash. */
export const FONT_CACHE = 'opm-fonts';
/** Lists the writing-system font files of this build, for saving them all for offline use. */
export const FONTS_MANIFEST = 'offline-fonts.json';

export interface FontsManifest {
  version: string;
  /** Paths relative to the app's base path. */
  files: string[];
  /** Total size of the files in bytes. */
  bytes: number;
}

/** Messages the app sends to the service worker. */
export type WorkerMessage = { type: 'SKIP_WAITING' };
