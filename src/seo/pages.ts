import { APP } from '@/config/app';
import { publicUrl } from '@/config/site';
import { TEMPLATE_CATEGORY_INFO } from '@/content/templateCategories';
import { TEMPLATES } from '@/content/templates';
import { TEMPLATE_CATEGORIES, type TemplateDefinition } from '@/core/templates';
import en from '@/i18n/locales/en.json';

export interface PublicPage {
  path: string;
  title: string;
  description: string;
  templates?: readonly TemplateDefinition[];
  template?: TemplateDefinition;
  breadcrumbs: { name: string; path: string }[];
}

const HOME = { name: 'Home', path: '/' };
const CATALOG = { name: 'Templates', path: '/templates' };

/** Only bundled, public content enters this list. It also drives the sitemap. */
export const PUBLIC_PAGES: readonly PublicPage[] = [
  {
    path: '/',
    title: 'Free design studio · Offline Promotion Manager',
    description:
      'Make posters, flyers, cards, certificates and social posts with a free, open-source design editor. Custom sizes, editable templates and local storage. No account needed.',
    templates: TEMPLATES,
    breadcrumbs: [HOME],
  },
  {
    path: '/templates',
    title: 'Free editable design templates',
    description: en.templates.subtitle,
    templates: TEMPLATES,
    breadcrumbs: [HOME, CATALOG],
  },
  ...TEMPLATE_CATEGORIES.map(
    (category): PublicPage => ({
      path: `/templates/category/${category}`,
      ...TEMPLATE_CATEGORY_INFO[category],
      templates: TEMPLATES.filter((template) => template.category === category),
      breadcrumbs: [
        HOME,
        CATALOG,
        { name: en.templates.categories[category], path: `/templates/category/${category}` },
      ],
    }),
  ),
  ...TEMPLATES.map(
    (template): PublicPage => ({
      path: `/templates/${template.id}`,
      title: `${template.name} · Free editable template`,
      description: template.description,
      template,
      breadcrumbs: [
        HOME,
        CATALOG,
        {
          name: en.templates.categories[template.category],
          path: `/templates/category/${template.category}`,
        },
        { name: template.name, path: `/templates/${template.id}` },
      ],
    }),
  ),
  {
    path: '/settings',
    title: 'Settings · Appearance, measurements and image search',
    description:
      'Choose light or dark mode, regional paper sizes and measurement units. Manage optional online image search and local browser storage in Offline Promotion Manager.',
    breadcrumbs: [HOME, { name: 'Settings', path: '/settings' }],
  },
];

const BY_PATH = new Map(PUBLIC_PAGES.map((page) => [page.path, page]));

export function getPublicPage(path: string): PublicPage | undefined {
  return BY_PATH.get(path.replace(/\/$/, '') || '/');
}

export interface PageMetadata {
  title: string;
  description: string;
  canonical?: string;
  indexable: boolean;
  structuredData?: Record<string, unknown>;
}

export function pageMetadata(path: string, personal = false): PageMetadata {
  const page = getPublicPage(path);
  if (!page || personal) {
    return {
      title: path.startsWith('/design/')
        ? `Design editor · ${APP.name}`
        : personal
          ? `Your templates · ${APP.name}`
          : `Page not found · ${APP.name}`,
      description: 'Your designs and saved templates stay on this device.',
      indexable: false,
    };
  }
  const canonical = publicUrl(page.path);
  const graph: Record<string, unknown>[] = [
    {
      '@type': page.template ? 'WebPage' : page.templates ? 'CollectionPage' : 'WebPage',
      '@id': `${canonical}#page`,
      url: canonical,
      name: page.title,
      description: page.description,
      inLanguage: 'en',
      isPartOf: { '@id': `${publicUrl()}#website` },
    },
    {
      '@type': 'WebSite',
      '@id': `${publicUrl()}#website`,
      name: APP.name,
      url: publicUrl(),
    },
  ];
  if (page.path === '/')
    graph.push({
      '@type': 'SoftwareApplication',
      name: APP.name,
      url: canonical,
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web browser',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      license: 'https://opensource.org/license/mit',
      author: { '@type': 'Person', name: APP.author.name, url: APP.author.url },
    });
  if (page.breadcrumbs.length > 1)
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: page.breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: publicUrl(crumb.path),
      })),
    });
  if (page.templates)
    graph.push({
      '@type': 'ItemList',
      itemListElement: page.templates.map((template, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: template.name,
        url: publicUrl(`/templates/${template.id}`),
      })),
    });
  if (page.template)
    graph.push({
      '@type': 'CreativeWork',
      name: page.template.name,
      description: page.description,
      url: canonical,
      isAccessibleForFree: true,
      license: 'https://opensource.org/license/mit',
    });
  return {
    title: page.path === '/' ? page.title : `${page.title} · ${APP.shortName}`,
    description: page.description,
    canonical,
    indexable: true,
    structuredData: { '@context': 'https://schema.org', '@graph': graph },
  };
}

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch,
  );
}

/** Identical metadata on first HTTP response and after client-side navigation. */
export function renderSeoHead(meta: PageMetadata): string {
  const e = escapeHtml;
  const tags = [
    `<title data-seo>${e(meta.title)}</title>`,
    `<meta data-seo name="description" content="${e(meta.description)}">`,
    `<meta data-seo name="robots" content="${meta.indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow'}">`,
    `<meta data-seo property="og:type" content="website">`,
    `<meta data-seo property="og:site_name" content="${e(APP.name)}">`,
    `<meta data-seo property="og:title" content="${e(meta.title)}">`,
    `<meta data-seo property="og:description" content="${e(meta.description)}">`,
    `<meta data-seo name="twitter:card" content="summary">`,
    `<meta data-seo name="twitter:title" content="${e(meta.title)}">`,
    `<meta data-seo name="twitter:description" content="${e(meta.description)}">`,
  ];
  if (meta.canonical)
    tags.push(
      `<link data-seo rel="canonical" href="${e(meta.canonical)}">`,
      `<meta data-seo property="og:url" content="${e(meta.canonical)}">`,
    );
  if (meta.structuredData)
    tags.push(
      `<script data-seo type="application/ld+json">${JSON.stringify(meta.structuredData).replace(/</g, '\\u003c')}</script>`,
    );
  return tags.join('\n');
}
