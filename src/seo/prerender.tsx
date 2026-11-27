import { renderToStaticMarkup } from 'react-dom/server';
import { APP } from '@/config/app';
import { BASE_PATH, GOOGLE_SITE_VERIFICATION, localPath, publicUrl, SITE_URL } from '@/config/site';
import { TEMPLATE_CATEGORY_INFO } from '@/content/templateCategories';
import { getPreset } from '@/core/paper';
import { TEMPLATE_CATEGORIES } from '@/core/templates';
import en from '@/i18n/locales/en.json';
import {
  escapeHtml,
  googleVerificationMeta,
  PUBLIC_PAGES,
  type PublicPage,
  pageMetadata,
  renderSeoHead,
} from './pages';

const linkClass = 'text-primary underline-offset-4 hover:underline';

/** Visible, useful HTML before JavaScript starts. Contains only bundled public content. */
function StaticPage({ page }: { page: PublicPage }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <a href={localPath('/')} className="font-bold">
          {APP.name}
        </a>
        <nav aria-label="Main navigation" className="flex gap-4">
          <a href={localPath('/templates')} className={linkClass}>
            Templates
          </a>
          <a href={localPath('/settings')} className={linkClass}>
            Settings
          </a>
        </nav>
      </header>
      <main className="space-y-6">
        <nav aria-label="Breadcrumbs" className="flex flex-wrap gap-3 text-sm">
          {page.breadcrumbs.map((crumb) => (
            <a key={crumb.path} href={localPath(crumb.path)} className={linkClass}>
              {crumb.name}
            </a>
          ))}
        </nav>
        <h1 className="font-bold text-3xl">
          {page.path === '/' ? en.home.title : (page.template?.name ?? page.title)}
        </h1>
        <p className="text-muted-foreground">{page.description}</p>
        {page.template && (
          <>
            <p>
              {en.presets[page.template.size.a4]} · {en.presets[page.template.size.letter]} ·{' '}
              {getPreset(page.template.size.a4)?.unit}
            </p>
            <h2 className="font-semibold text-xl">{en.templates.personaliseTitle}</h2>
            <p>{en.templates.personaliseBody}</p>
            <p>Enable JavaScript to open this template in the editor.</p>
          </>
        )}
        {page.templates && (
          <>
            <nav aria-label="Template categories" className="flex flex-wrap gap-3">
              {TEMPLATE_CATEGORIES.map((category) => (
                <a
                  key={category}
                  href={localPath(`/templates/category/${category}`)}
                  className={linkClass}
                >
                  {en.templates.categories[category]}
                </a>
              ))}
            </nav>
            <h2 className="font-semibold text-xl">{en.home.templatesTitle}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {page.templates.map((template) => (
                <li key={template.id} className="space-y-2 rounded-xl border p-4">
                  <h3 className="font-semibold">
                    <a href={localPath(`/templates/${template.id}`)} className={linkClass}>
                      {template.name}
                    </a>
                  </h3>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </li>
              ))}
            </ul>
          </>
        )}
        {page.path === '/' && (
          <section className="space-y-3">
            <h2 className="font-semibold text-xl">Design on your device</h2>
            <p>
              Add text, images, shapes, QR codes and Smart Grids. Start with regional paper sizes or
              custom dimensions. Use colour palettes and font pairings to make each design your own.
            </p>
            <p>
              Your work is saved in this browser. No account or backend is required. Print at true
              size on any paper, tile posters across sheets, or download PNG, JPG and PDF files.
              Install the app to start it and keep designing without an internet connection.
            </p>
          </section>
        )}
        {page.path === '/settings' && (
          <section className="space-y-3">
            <h2 className="font-semibold text-xl">Appearance and measurements</h2>
            <p>
              Choose light, dark or system theme. Set your preferred units and use A4 or US Letter
              paper by default.
            </p>
            <h2 className="font-semibold text-xl">Online image search</h2>
            <p>
              Optional Openverse and Wikimedia Commons search is enabled by default and can be
              turned off. Selected images are saved locally for reuse.
            </p>
            <h2 className="font-semibold text-xl">Local storage</h2>
            <p>
              View browser storage usage and request persistent storage. Enable JavaScript to change
              settings on this device.
            </p>
            <h2 className="font-semibold text-xl">Offline use</h2>
            <p>
              Install the app, check that it is ready to work offline, and save the fonts for every
              writing system for use without an internet connection.
            </p>
          </section>
        )}
        {page.template && (
          <section className="space-y-2">
            <h2 className="font-semibold text-xl">{en.templates.related}</h2>
            <a
              href={localPath(`/templates/category/${page.template.category}`)}
              className={linkClass}
            >
              {TEMPLATE_CATEGORY_INFO[page.template.category].title}
            </a>
          </section>
        )}
      </main>
      <footer className="mt-10 space-y-2 border-t pt-4 text-sm text-muted-foreground">
        <p>
          {en.footer.privacy} {en.footer.openSource}
        </p>
        <a href={APP.author.url} className={linkClass}>
          Built by {APP.author.name}
        </a>
      </footer>
    </div>
  );
}

/**
 * The install manifest. URLs are relative to the manifest, so the same file works at the
 * domain root and in a sub-folder. The app name comes from `APP`, like everywhere else.
 */
export function webManifest(): string {
  const icon = (src: string, size: number, purpose?: 'maskable') => ({
    src,
    sizes: `${size}x${size}`,
    type: 'image/png',
    ...(purpose ? { purpose } : {}),
  });
  return `${JSON.stringify(
    {
      name: APP.name,
      short_name: APP.shortName,
      description: pageMetadata('/').description,
      lang: 'en',
      dir: 'ltr',
      start_url: './',
      scope: './',
      display: 'standalone',
      orientation: 'any',
      background_color: '#fcfcfd',
      theme_color: '#fcfcfd',
      categories: ['design', 'graphics', 'productivity'],
      icons: [
        { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        icon('icons/icon-192.png', 192),
        icon('icons/icon-512.png', 512),
        icon('icons/maskable-512.png', 512, 'maskable'),
      ],
      shortcuts: [
        {
          name: en.nav.templates,
          url: 'templates',
          icons: [icon('icons/icon-192.png', 192)],
        },
      ],
    },
    null,
    2,
  )}\n`;
}

/** Installing the app: the manifest, and the home-screen icon and name for iPhone and iPad. */
const extraHead = [
  `<link rel="manifest" href="${escapeHtml(localPath('/manifest.webmanifest'))}">`,
  `<link rel="apple-touch-icon" href="${escapeHtml(localPath('/icons/apple-touch-icon.png'))}">`,
  `<meta name="apple-mobile-web-app-title" content="${escapeHtml(APP.shortName)}">`,
  googleVerificationMeta(GOOGLE_SITE_VERIFICATION),
]
  .filter(Boolean)
  .join('\n    ');

export function renderPublicFiles(shell: string): { path: string; content: string }[] {
  if (!shell.includes('<!--seo-->') || !shell.includes('<div id="root"></div>'))
    throw new Error('The static HTML shell is missing its SEO or root marker.');
  const render = (path: string, body: string) =>
    shell
      .replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, renderSeoHead(pageMetadata(path)))
      .replace('</head>', `  ${extraHead}\n  </head>`)
      .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  const files = PUBLIC_PAGES.map((page) => ({
    path: page.path === '/' ? 'index.html' : `${page.path.slice(1)}/index.html`,
    content: render(page.path, renderToStaticMarkup(<StaticPage page={page} />)),
  }));
  files.push(
    {
      path: 'editor.html',
      content: render(
        '/design/local',
        '<main><h1>Design editor</h1><p>Open your design on this device.</p></main>',
      ),
    },
    {
      path: '404.html',
      content: render(
        '/404',
        `<main><h1>Page not found</h1><a href="${escapeHtml(localPath('/'))}">Back to home</a></main>`,
      ),
    },
    {
      path: 'sitemap.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PUBLIC_PAGES.map((page) => `  <url><loc>${escapeHtml(publicUrl(page.path))}</loc></url>`).join('\n')}\n</urlset>\n`,
    },
    // Crawlers can read noindex on private/unknown routes; do not block it with Disallow.
    {
      path: 'robots.txt',
      content: `User-agent: *\nAllow: /\n\nSitemap: ${publicUrl('/sitemap.xml')}\n`,
    },
    { path: 'CNAME', content: `${new URL(SITE_URL).hostname}\n` },
    { path: 'manifest.webmanifest', content: webManifest() },
    // Netlify / Cloudflare Pages: the service worker and manifest are always revalidated, so
    // updates arrive; file names in assets/ contain a content hash and never change.
    {
      path: '_headers',
      content: [
        `${BASE_PATH}/sw.js`,
        '  Cache-Control: no-cache',
        `${BASE_PATH}/manifest.webmanifest`,
        '  Cache-Control: no-cache',
        '  Content-Type: application/manifest+json',
        `${BASE_PATH}/offline-fonts.json`,
        '  Cache-Control: no-cache',
        `${BASE_PATH}/assets/*`,
        '  Cache-Control: public, max-age=31536000, immutable',
        '',
      ].join('\n'),
    },
    // Netlify / Cloudflare Pages: real public HTML, local editor shell, and real 404s.
    {
      path: '_redirects',
      content: `${PUBLIC_PAGES.filter((page) => page.path !== '/')
        .map((page) => `${localPath(page.path)} ${localPath(`${page.path}/index.html`)} 200`)
        .join(
          '\n',
        )}\n${BASE_PATH}/design/* ${BASE_PATH}/editor.html 200\n${BASE_PATH}/* ${BASE_PATH}/404.html 404\n`,
    },
  );
  return files;
}
