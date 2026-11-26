import { useTranslation } from 'react-i18next';
import { DesignThumbnail } from '@/features/design/DesignThumbnail';
import type { CatalogItem } from './catalog';

export function TemplateCard({
  item,
  onOpen,
}: {
  item: CatalogItem;
  onOpen: (item: CatalogItem) => void;
}) {
  const { t } = useTranslation();
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
      <button
        type="button"
        data-testid="template-card"
        aria-label={t('templates.preview', { name: item.name })}
        onClick={() => onOpen(item)}
        className="group flex w-full min-w-0 flex-1 flex-col text-start outline-none transition hover:bg-muted/30 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span className="block aspect-[4/5] w-full bg-canvas p-3 transition group-hover:bg-canvas/70">
          <DesignThumbnail design={item.preview} />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5 p-3">
          <span className="truncate font-medium text-sm">{item.name}</span>
          <span className="truncate text-muted-foreground text-xs">
            {item.kind === 'saved'
              ? t('templates.savedHere')
              : t(`templates.categories.${item.category}`)}
          </span>
        </span>
      </button>
      {item.kind === 'bundled' && (
        <Link
          to="/templates/$templateId"
          params={{ templateId: item.template.id }}
          className="px-3 pb-3 text-primary text-xs underline-offset-4 hover:underline"
        >
          {t('templates.details')}
        </Link>
      )}
    </article>
  );
}

import { Link } from '@tanstack/react-router';
