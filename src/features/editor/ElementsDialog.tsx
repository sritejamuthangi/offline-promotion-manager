import { Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ICON_NAMES, type IconName, STICKER_NAMES, type StickerName } from '@/core/schema';
import { stickerPath } from '@/core/stickers';
import { humanize } from '@/lib/humanize';
import { ICON_COMPONENTS } from '@/render/icons';

type Tab = 'icons' | 'stickers';

export function ElementsDialog({
  open,
  onOpenChange,
  onInsertIcon,
  onInsertSticker,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertIcon: (icon: IconName) => void;
  onInsertSticker: (sticker: StickerName) => void;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('icons');
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const icons = ICON_NAMES.filter((name) => humanize(name).toLowerCase().includes(needle));
  const stickers = STICKER_NAMES.filter((name) => humanize(name).toLowerCase().includes(needle));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('editor.elements')}</DialogTitle>
          <DialogDescription>{t('editor.elementsHint')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={tab === 'icons' ? 'secondary' : 'ghost'}
            aria-pressed={tab === 'icons'}
            onClick={() => setTab('icons')}
          >
            {t('editor.iconsTab')}
          </Button>
          <Button
            size="sm"
            variant={tab === 'stickers' ? 'secondary' : 'ghost'}
            aria-pressed={tab === 'stickers'}
            onClick={() => setTab('stickers')}
          >
            {t('editor.stickersTab')}
          </Button>
          <div className="relative ms-auto min-w-40 flex-1 sm:max-w-56">
            <Search className="pointer-events-none absolute start-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Label htmlFor="element-search" className="sr-only">
              {t('editor.searchElements')}
            </Label>
            <Input
              id="element-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('editor.searchElements')}
              className="ps-8"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {tab === 'icons' &&
            icons.map((name) => {
              const Icon = ICON_COMPONENTS[name];
              return (
                <button
                  key={name}
                  type="button"
                  aria-label={humanize(name)}
                  title={humanize(name)}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border bg-background p-2 text-[11px] text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    onInsertIcon(name);
                    onOpenChange(false);
                  }}
                >
                  <Icon aria-hidden="true" className="size-6 text-foreground" />
                  <span className="w-full truncate text-center">{humanize(name)}</span>
                </button>
              );
            })}
          {tab === 'stickers' &&
            stickers.map((name) => (
              <button
                key={name}
                type="button"
                aria-label={humanize(name)}
                title={humanize(name)}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border bg-background p-2 text-[11px] text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  onInsertSticker(name);
                  onOpenChange(false);
                }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 100 100"
                  className="size-8 fill-primary text-primary"
                >
                  <path d={stickerPath(name)} />
                </svg>
                <span className="w-full truncate text-center">{humanize(name)}</span>
              </button>
            ))}
        </div>
        {((tab === 'icons' && !icons.length) || (tab === 'stickers' && !stickers.length)) && (
          <p className="py-6 text-center text-muted-foreground text-sm">{t('editor.noResults')}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
