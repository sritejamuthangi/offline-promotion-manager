/**
 * Request routing for the service worker, as pure functions. Paths are relative to the
 * app's base path ("" is the home page), so sub-folder deployments work unchanged.
 */

/** App screens (no file extension) are served by the app; files like sitemap.xml are not. */
export function isAppRoute(path: string): boolean {
  return !/\.[a-z0-9]+$/i.test(path);
}

/**
 * The saved page that starts the app offline for a screen: the home page for the home
 * screen, and the editor shell (which routes in the browser) for every other screen.
 */
export function offlineDocument(path: string): string | undefined {
  if (!isAppRoute(path)) return undefined;
  return path === '' ? 'index.html' : 'editor.html';
}

/** The path of a URL relative to the scope, or undefined when it's outside the scope. */
export function scopedPath(url: URL, scope: URL): string | undefined {
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return undefined;
  return decodeURIComponent(url.pathname.slice(scope.pathname.length));
}
