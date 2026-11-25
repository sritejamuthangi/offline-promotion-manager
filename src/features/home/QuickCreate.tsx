import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPreset, presetSizePx } from '@/core/paper';
import { formatSize } from '@/core/units';
import { PageShape } from '@/features/design/DesignThumbnail';
import { useEffectivePaper } from '@/features/settings/settingsStore';
import { CreateDesignDialog } from './CreateDesignDialog';
import { quickCreateItems } from './quickCreateItems';
import { useCreateDesign } from './useCreateDesign';

const tileClasses =
  'group flex h-full w-full flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center shadow-xs outline-none transition hover:border-primary/40 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60';

export function QuickCreate() {
  const { t, i18n } = useTranslation();
  const paper = useEffectivePaper();
  const { create, creating } = useCreateDesign();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section aria-labelledby="quick-create-title" className="mt-8">
      <h2 id="quick-create-title" className="mb-3 font-semibold text-lg">
        {t('home.startTitle')}
      </h2>
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-8">
        {quickCreateItems(paper).map((item) => {
          const preset = getPreset(item.presetId);
          if (!preset) return null;
          const size = presetSizePx(preset);
          return (
            <li key={item.key} className="w-32 shrink-0 snap-start sm:w-auto">
              <button
                type="button"
                disabled={creating}
                data-testid={`quick-create-${item.presetId}`}
                onClick={() => create({ ...size, unit: preset.unit, presetId: preset.id })}
                className={tileClasses}
              >
                <span className="flex h-16 w-full items-center justify-center [container-type:size]">
                  <PageShape width={size.width} height={size.height} />
                </span>
                <span className="font-medium text-sm">{t(`quick.${item.key}`)}</span>
                <span className="text-muted-foreground text-xs">
                  {formatSize(size.width, size.height, preset.unit, i18n.language)}
                </span>
              </button>
            </li>
          );
        })}
        <li className="w-32 shrink-0 snap-start sm:w-auto">
          <button
            type="button"
            data-testid="more-sizes"
            onClick={() => setDialogOpen(true)}
            className={tileClasses}
          >
            <span className="flex h-16 w-full items-center justify-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition group-hover:scale-105">
                <Plus className="size-5" aria-hidden="true" />
              </span>
            </span>
            <span className="font-medium text-sm">{t('home.moreSizes')}</span>
            <span className="text-muted-foreground text-xs">{t('home.moreSizesHint')}</span>
          </button>
        </li>
      </ul>
      <CreateDesignDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
}
