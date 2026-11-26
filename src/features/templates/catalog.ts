import { useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { TEMPLATES } from '@/content/templates';
import { browserLocale, type PaperFamily } from '@/core/locale';
import type { Design } from '@/core/schema';
import {
  designFromSavedTemplate,
  designFromTemplate,
  matchesTemplateQuery,
  type TemplateCategory,
  type TemplateDefinition,
} from '@/core/templates';
import { useEffectivePaper } from '@/features/settings/settingsStore';
import { designRepository, requestPersistentStorage, type SavedTemplate } from '@/storage';
import { useSavedTemplates } from '@/storage/hooks';

/** A template in the catalogue: bundled with the app, or saved by the person on this device. */
export type CatalogItem =
  | {
      kind: 'bundled';
      key: string;
      name: string;
      category: TemplateCategory;
      tags: readonly string[];
      template: TemplateDefinition;
      preview: Design;
    }
  | {
      kind: 'saved';
      key: string;
      name: string;
      category?: TemplateCategory;
      tags: readonly string[];
      saved: SavedTemplate;
      preview: Design;
    };

const previews = new Map<string, Design>();
const NONE_SAVED: SavedTemplate[] = [];

/** A preview design at the person's paper size. Built once per template and size. */
export function previewOf(template: TemplateDefinition, paper: PaperFamily): Design {
  const key = `${template.id}|${paper}`;
  let design = previews.get(key);
  if (!design) {
    design = designFromTemplate(template, { paper, now: 0 });
    previews.set(key, design);
  }
  return design;
}

/**
 * Every template people can start from, bundled first. Saved templates join as soon as the local database answers, so a slow
 * or unavailable database never hides the bundled ones.
 */
export function useTemplateCatalog(): CatalogItem[] {
  const saved = useSavedTemplates() ?? NONE_SAVED;
  const paper = useEffectivePaper();
  return useMemo(() => {
    const items: CatalogItem[] = TEMPLATES.map((template) => ({
      kind: 'bundled',
      key: `bundled:${template.id}`,
      name: template.name,
      category: template.category,
      tags: template.tags,
      template,
      preview: previewOf(template, paper),
    }));
    for (const record of saved)
      items.push({
        kind: 'saved',
        key: `saved:${record.id}`,
        name: record.name,
        category: record.category,
        tags: [],
        saved: record,
        preview: record.design,
      });
    return items;
  }, [saved, paper]);
}

export type CatalogFilter = TemplateCategory | 'all' | 'mine';

export function filterCatalog(
  items: readonly CatalogItem[],
  filter: CatalogFilter,
  query: string,
  categoryName: (category: TemplateCategory) => string,
): CatalogItem[] {
  return items.filter((item) => {
    if (filter === 'mine' && item.kind !== 'saved') return false;
    if (filter !== 'all' && filter !== 'mine' && item.category !== filter) return false;
    return matchesTemplateQuery(query, [
      item.name,
      item.category ? categoryName(item.category) : undefined,
      ...item.tags,
    ]);
  });
}

/** Creates a design from a template, saves it on this device and opens it. */
export function useCreateFromTemplate() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const paper = useEffectivePaper();
  const [creating, setCreating] = useState<string | null>(null);

  const create = useCallback(
    async (item: CatalogItem) => {
      setCreating(item.key);
      try {
        const design =
          item.kind === 'bundled'
            ? designFromTemplate(item.template, { paper, locale: browserLocale() })
            : designFromSavedTemplate(item.saved.design, {
                templateId: item.saved.id,
                name: item.saved.name,
              });
        await designRepository.save(design);
        void requestPersistentStorage();
        await navigate({ to: '/design/$designId', params: { designId: design.id } });
      } catch (error) {
        console.error('Could not create a design from the template', error);
        toast.error(t('templates.createFailed'));
        setCreating(null);
      }
    },
    [navigate, paper, t],
  );

  return { create, creating };
}
