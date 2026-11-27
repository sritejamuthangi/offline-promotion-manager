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

/** The social preview shown when a link is shared; the file lives in `public/og-image.png`. */
const SOCIAL_IMAGE = {
  url: publicUrl('/og-image.png'),
  alt: 'Offline Promotion Manager — design anything, print any size',
  width: 1200,
  height: 630,
  type: 'image/png',
} as const;

/** Broad studio terms used on every public page. Page subjects and tags are added below. */
const BASE_KEYWORDS = [
  'free design tool',
  'poster maker',
  'flyer maker',
  'business card maker',
  'certificate maker',
  'print design software',
  'editable design templates',
  'offline design app',
  'open source design tool',
  'no watermark',
] as const;

/** Search words for a page: broad studio terms plus its own subjects and template tags. */
function keywordsFor(page: PublicPage): string[] {
  const words = new Set<string>(BASE_KEYWORDS);
  if (page.path === '/') {
    for (const category of TEMPLATE_CATEGORIES)
      words.add(`${en.templates.categories[category].toLowerCase()} templates`);
  } else if (page.template) {
    const name = page.template.name.toLowerCase();
    words.add(name);
    words.add(`${name} template`);
    words.add(`${name} maker`);
    words.add(TEMPLATE_CATEGORY_INFO[page.template.category].title.toLowerCase());
    for (const tag of page.template.tags) words.add(tag);
  } else if (page.path === '/templates') {
    words.add('free design templates');
    for (const category of TEMPLATE_CATEGORIES)
      words.add(`${en.templates.categories[category].toLowerCase()} templates`);
  } else if (page.templates) {
    words.add('free design templates');
    words.add(page.title.toLowerCase());
    for (const template of page.templates) for (const tag of template.tags) words.add(tag);
  } else if (page.path === '/settings') {
    words.add('design app settings');
    words.add('paper sizes');
    words.add('measurement units');
    words.add('offline design app');
  }
  return [...words].slice(0, 30);
}

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
  keywords?: string;
  canonical?: string;
  image?: typeof SOCIAL_IMAGE;
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
      image: SOCIAL_IMAGE.url,
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
      image: SOCIAL_IMAGE.url,
      screenshot: SOCIAL_IMAGE.url,
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
      image: SOCIAL_IMAGE.url,
      keywords: page.template.tags.join(', '),
      genre: TEMPLATE_CATEGORY_INFO[page.template.category].title.toLowerCase(),
    });
  return {
    title: page.path === '/' ? page.title : `${page.title} · ${APP.shortName}`,
    description: page.description,
    keywords: keywordsFor(page).join(', '),
    canonical,
    image: SOCIAL_IMAGE,
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

/**
 * Google Search Console's HTML-tag verification. Pass the `content` value from the tag it
 * shows; an empty value leaves the tag out.
 */
export function googleVerificationMeta(token: string | undefined): string {
  const content = token?.trim();
  return content ? `<meta name="google-site-verification" content="${escapeHtml(content)}">` : '';
}

/** Identical metadata on first HTTP response and after client-side navigation. */
export function renderSeoHead(meta: PageMetadata): string {
  const e = escapeHtml;
  const tags = [
    `<title data-seo>${e(meta.title)}</title>`,
    `<meta data-seo name="description" content="${e(meta.description)}">`,
    ...(meta.keywords ? [`<meta data-seo name="keywords" content="${e(meta.keywords)}">`] : []),
    `<meta data-seo name="robots" content="${meta.indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow'}">`,
    `<meta data-seo name="author" content="${e(APP.author.name)}">`,
    `<meta data-seo property="og:type" content="website">`,
    `<meta data-seo property="og:site_name" content="${e(APP.name)}">`,
    `<meta data-seo property="og:locale" content="en_GB">`,
    `<meta data-seo property="og:title" content="${e(meta.title)}">`,
    `<meta data-seo property="og:description" content="${e(meta.description)}">`,
    `<meta data-seo name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}">`,
    `<meta data-seo name="twitter:title" content="${e(meta.title)}">`,
    `<meta data-seo name="twitter:description" content="${e(meta.description)}">`,
  ];
  if (meta.image) {
    const image = meta.image;
    tags.push(
      `<meta data-seo property="og:image" content="${e(image.url)}">`,
      `<meta data-seo property="og:image:type" content="${e(image.type)}">`,
      `<meta data-seo property="og:image:width" content="${image.width}">`,
      `<meta data-seo property="og:image:height" content="${image.height}">`,
      `<meta data-seo property="og:image:alt" content="${e(image.alt)}">`,
      `<meta data-seo name="twitter:image" content="${e(image.url)}">`,
      `<meta data-seo name="twitter:image:alt" content="${e(image.alt)}">`,
    );
  }
  if (meta.canonical) {
    tags.push(
      `<link data-seo rel="canonical" href="${e(meta.canonical)}">`,
      `<meta data-seo property="og:url" content="${e(meta.canonical)}">`,
      `<meta data-seo property="og:locale:alternate" content="en_US">`,
      `<meta data-seo name="twitter:url" content="${e(meta.canonical)}">`,
      `<link data-seo rel="alternate" hreflang="en" href="${e(meta.canonical)}">`,
      `<link data-seo rel="alternate" hreflang="x-default" href="${e(meta.canonical)}">`,
    );
  }
  if (meta.structuredData)
    tags.push(
      `<script data-seo type="application/ld+json">${JSON.stringify(meta.structuredData).replace(/</g, '\\u003c')}</script>`,
    );
  return tags.join('\n');
}
