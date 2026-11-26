import { LayoutTemplate, Search } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import type { Design } from '@/core/schema';
import { SaveTemplateDialog } from '@/features/templates/SaveTemplateDialog';
import { useNow } from '@/lib/hooks';
import { useDeletedDesigns, useDesigns } from '@/storage/hooks';
import { DesignCard } from './DesignCard';
import { DESIGN_SORTS, type DesignSort, filterAndSortDesigns } from './designList';
import { RecentlyDeleted } from './RecentlyDeleted';
import { RenameDialog } from './RenameDialog';

const SORT_LABELS = {
  updated: 'home.sortUpdated',
  created: 'home.sortCreated',
  name: 'home.sortName',
} as const satisfies Record<DesignSort, string>;

export function DesignsSection() {
  const { t, i18n } = useTranslation();
  const designs = useDesigns();
  const deleted = useDeletedDesigns();
  const now = useNow(60_000);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DesignSort>('updated');
  const [renaming, setRenaming] = useState<Design | null>(null);
  const [savingTemplate, setSavingTemplate] = useState<Design | null>(null);
  const searchId = useId();
  const sortId = useId();

  const visible = useMemo(
    () => filterAndSortDesigns(designs ?? [], query, sort, i18n.language),
    [designs, query, sort, i18n.language],
  );

  return (
    <section aria-labelledby="designs-title" className="mt-10 sm:mt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="designs-title" className="font-semibold text-lg">
            {t('home.yourDesigns')}
          </h2>
          {designs && designs.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {t('home.designCount', { count: designs.length })}
            </p>
          )}
        </div>
        {designs && designs.length > 0 && (
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64 sm:flex-none">
              <label htmlFor={searchId} className="sr-only">
                {t('home.search')}
              </label>
              <Search
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('home.search')}
                className="ps-9"
              />
            </div>
            <label htmlFor={sortId} className="sr-only">
              {t('home.sortBy')}
            </label>
            <NativeSelect
              id={sortId}
              value={sort}
              onChange={(e) => setSort(e.target.value as DesignSort)}
              wrapperClassName="w-36 shrink-0"
            >
              {DESIGN_SORTS.map((key) => (
                <option key={key} value={key}>
                  {t(SORT_LABELS[key])}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
      </div>

      {designs === undefined ? (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {['a', 'b', 'c', 'd'].map((key) => (
            <li key={key} className="aspect-[4/5] animate-pulse rounded-xl bg-muted" />
          ))}
        </ul>
      ) : designs.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
          <LayoutTemplate className="size-10 text-muted-foreground/60" aria-hidden="true" />
          <p className="font-medium">{t('home.emptyTitle')}</p>
          <p className="text-muted-foreground text-sm">{t('home.emptyBody')}</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{t('home.noResults', { query: query.trim() })}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((design) => (
            <li key={design.id}>
              <DesignCard
                design={design}
                now={now}
                onRename={setRenaming}
                onSaveTemplate={setSavingTemplate}
              />
            </li>
          ))}
        </ul>
      )}

      {deleted && deleted.length > 0 && <RecentlyDeleted designs={deleted} now={now} />}

      <RenameDialog design={renaming} onClose={() => setRenaming(null)} />
      <SaveTemplateDialog design={savingTemplate} onClose={() => setSavingTemplate(null)} />
    </section>
  );
}
