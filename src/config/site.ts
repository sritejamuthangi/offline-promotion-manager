/** Public deployment identity, shared by browser metadata and the static-site build. */
const configured = import.meta.env.VITE_SITE_URL || 'https://opm.sritejam.com';
const site = new URL(configured);
if (!['https:', 'http:'].includes(site.protocol) || site.search || site.hash)
  throw new Error('VITE_SITE_URL must be an HTTP(S) URL without a query or fragment.');

export const SITE_URL = site.href.replace(/\/$/, '');
export const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

export function publicUrl(path = '/'): string {
  return `${SITE_URL}${path === '/' ? '/' : path.replace(/\/$/, '')}`;
}

/** Same-origin links, including when the app is hosted in a sub-folder. */
export function localPath(path: string): string {
  return `${BASE_PATH}${path}`;
}
