let loading: Promise<void> | undefined;

/**
 * Loads the writing-system font stylesheets (about 400 KB, mostly Chinese, Japanese and
 * Korean character ranges) without delaying the first screen. Safe to call often: it loads
 * once. Printing and exports wait for it, so every script is drawn with bundled fonts.
 */
export function loadScriptFonts(): Promise<void> {
  loading ??= import('./scriptFonts').then(
    () => undefined,
    (error: unknown) => {
      // Try again next time, e.g. after a lost connection comes back.
      loading = undefined;
      throw error;
    },
  );
  return loading;
}
