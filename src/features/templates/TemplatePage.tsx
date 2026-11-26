import { Link, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { NotFoundPage } from '@/app/NotFoundPage';
import { Button } from '@/components/ui/button';
import { getTemplate, TEMPLATES } from '@/content/templates';
import { formatSize } from '@/core/units';
import { DesignThumbnail } from '@/features/design/DesignThumbnail';
import { useEffectivePaper } from '@/features/settings/settingsStore';
import { type CatalogItem, previewOf, useCreateFromTemplate } from './catalog';

/** Public, shareable template page. Using it creates a separate local design. */
export function TemplatePage() {
  const { templateId } = useParams({ from: '/app/templates/$templateId' });
  const { t, i18n } = useTranslation();
  const paper = useEffectivePaper();
  const { create, creating } = useCreateFromTemplate();
  const template = getTemplate(templateId);
  if (!template) return <NotFoundPage />;
  const preview = previewOf(template, paper);
  const item: CatalogItem = {
    kind: 'bundled',
    key: `bundled:${template.id}`,
    name: template.name,
    category: template.category,
    tags: template.tags,
    template,
    preview,
  };
  const related = TEMPLATES.filter(
    (other) => other.category === template.category && other.id !== template.id,
  );
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav
        aria-label={t('templates.breadcrumbs')}
        className="mb-6 flex flex-wrap gap-2 text-sm text-muted-foreground"
      >
        <Link to="/">{t('nav.home')}</Link>
        <span aria-hidden="true">/</span>
        <Link to="/templates">{t('templates.title')}</Link>
        <span aria-hidden="true">/</span>
        <Link to="/templates/category/$category" params={{ category: template.category }}>
          {t(`templates.categories.${template.category}`)}
        </Link>
      </nav>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="h-[55dvh] rounded-xl bg-canvas p-5 md:h-[65dvh]">
          <DesignThumbnail design={preview} />
        </div>
        <div className="space-y-5">
          <h1 className="font-bold text-3xl tracking-tight">{template.name}</h1>
          <p className="text-muted-foreground">{template.description}</p>
          <p className="text-sm">
            {formatSize(preview.width, preview.height, preview.unit, i18n.language)} ·{' '}
            {preview.theme.fonts.heading} · {preview.theme.fonts.body}
          </p>
          <Button size="lg" disabled={creating !== null} onClick={() => void create(item)}>
            {creating ? t('templates.opening') : t('templates.use')}
          </Button>
          <h2 className="font-semibold text-lg">{t('templates.personaliseTitle')}</h2>
          <p className="text-muted-foreground">{t('templates.personaliseBody')}</p>
          {related.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-semibold text-lg">{t('templates.related')}</h2>
              <ul className="space-y-2">
                {related.map((other) => (
                  <li key={other.id}>
                    <Link
                      className="text-primary underline-offset-4 hover:underline"
                      to="/templates/$templateId"
                      params={{ templateId: other.id }}
                    >
                      {other.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
