import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type CatalogItem, useTemplateCatalog } from '@/features/templates/catalog';
import { TemplateCard } from '@/features/templates/TemplateCard';
import { TemplatePreviewDialog } from '@/features/templates/TemplatePreviewDialog';

const FEATURED = 6;

/** A row of featured templates on the home screen, with a link to the full catalogue. */
export function TemplatesSection() {
  const { t } = useTranslation();
  const catalog = useTemplateCatalog();
  const [open, setOpen] = useState<CatalogItem | null>(null);
  const featured = catalog?.filter((item) => item.kind === 'bundled').slice(0, FEATURED);

  return (
    <section aria-labelledby="templates-title" className="mt-10 sm:mt-12">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <h2 id="templates-title" className="font-semibold text-lg">
            {t('home.templatesTitle')}
          </h2>
          <p className="text-muted-foreground text-sm">{t('home.templatesHint')}</p>
        </div>
        <Link
          to="/templates"
          className="inline-flex items-center gap-1 rounded-md font-medium text-primary text-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {t('home.allTemplates')}
          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
      <ul className="-mx-4 mt-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6">
        {featured
          ? featured.map((item) => (
              <li key={item.key} className="w-36 shrink-0 snap-start sm:w-auto">
                <TemplateCard item={item} onOpen={setOpen} />
              </li>
            ))
          : Array.from({ length: FEATURED }, (_, index) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: Static loading placeholders.
                key={index}
                className="aspect-[4/6] w-36 shrink-0 animate-pulse rounded-xl bg-muted sm:w-auto"
              />
            ))}
      </ul>
      <TemplatePreviewDialog item={open} onClose={() => setOpen(null)} />
    </section>
  );
}
