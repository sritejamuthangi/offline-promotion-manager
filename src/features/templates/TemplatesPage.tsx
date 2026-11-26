import { Link, useParams, useSearch } from '@tanstack/react-router';
import { LayoutTemplate, Search } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NotFoundPage } from '@/app/NotFoundPage';
import { Input } from '@/components/ui/input';
import { TEMPLATE_CATEGORY_INFO } from '@/content/templateCategories';
import { TEMPLATE_CATEGORIES } from '@/core/templates';
import { type CatalogFilter, type CatalogItem, filterCatalog, useTemplateCatalog } from './catalog';
import { TemplateCard } from './TemplateCard';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';

const FILTERS: readonly CatalogFilter[] = ['all', ...TEMPLATE_CATEGORIES, 'mine'];

function isFilter(value: unknown): value is CatalogFilter {
  return typeof value === 'string' && (FILTERS as readonly string[]).includes(value);
}

export function TemplatesPage() {
  const { t } = useTranslation();
  const search = useSearch({ strict: false }) as { category?: unknown };
  const params = useParams({ strict: false });
  const category = params.category;
  const filter: CatalogFilter = isFilter(category)
    ? category
    : isFilter(search.category)
      ? search.category
      : 'all';
  const [query, setQuery] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const catalog = useTemplateCatalog();
  const searchId = useId();
  // Look the open template up live, so renames show and deleted templates close the preview.
  const open = catalog?.find((item) => item.key === openKey) ?? null;
  const show = (item: CatalogItem) => setOpenKey(item.key);

  const visible = useMemo(
    () =>
      catalog &&
      filterCatalog(catalog, filter, query, (category) => t(`templates.categories.${category}`)),
    [catalog, filter, query, t],
  );

  if (category && !(TEMPLATE_CATEGORIES as readonly string[]).includes(category))
    return <NotFoundPage />;
  const info = filter !== 'all' && filter !== 'mine' ? TEMPLATE_CATEGORY_INFO[filter] : undefined;
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:pt-10">
      <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
        {info?.title ?? t('templates.title')}
      </h1>
      <p className="mt-1 text-muted-foreground">{info?.description ?? t('templates.subtitle')}</p>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav
          aria-label={t('templates.filters')}
          className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1 scrollbar-none"
        >
          {FILTERS.map((key) => (
            <Link
              key={key}
              to={key === 'all' || key === 'mine' ? '/templates' : '/templates/category/$category'}
              params={key === 'all' || key === 'mine' ? {} : { category: key }}
              search={key === 'mine' ? { category: 'mine' } : {}}
              aria-current={filter === key ? 'page' : undefined}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm outline-none hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-background aria-[current=page]:shadow-sm"
            >
              {key === 'all'
                ? t('templates.all')
                : key === 'mine'
                  ? t('templates.mine')
                  : t(`templates.categories.${key}`)}
            </Link>
          ))}
        </nav>
        <div className="relative lg:w-72">
          <label htmlFor={searchId} className="sr-only">
            {t('templates.search')}
          </label>
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('templates.search')}
            className="ps-9"
          />
        </div>
      </div>

      {visible === undefined ? (
        <p className="mt-8 text-muted-foreground" role="status">
          {t('templates.loading')}
        </p>
      ) : visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
          <LayoutTemplate className="size-10 text-muted-foreground/60" aria-hidden="true" />
          <p className="max-w-md text-muted-foreground text-sm">
            {query.trim()
              ? t('templates.noResults', { query: query.trim() })
              : t('templates.mineEmpty')}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((item) => (
            <li key={item.key}>
              <TemplateCard item={item} onOpen={show} />
            </li>
          ))}
        </ul>
      )}

      <TemplatePreviewDialog item={open} onClose={() => setOpenKey(null)} />
    </div>
  );
}
