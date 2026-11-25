import { ChevronDown, RotateCcw, Trash } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Design } from '@/core/schema';
import { DesignThumbnail } from '@/features/design/DesignThumbnail';
import { formatRelativeTime } from '@/lib/format';
import { useDesignActions } from './useDesignActions';

export function RecentlyDeleted({ designs, now }: { designs: Design[]; now: number }) {
  const { t, i18n } = useTranslation();
  const actions = useDesignActions();
  const [confirming, setConfirming] = useState<Design | null>(null);

  return (
    <section aria-label={t('trash.title')} className="mt-12">
      <details className="group rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <Trash className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium">{t('trash.title')}</span>
          <span className="rounded-full bg-muted px-2 text-muted-foreground text-xs leading-5">
            {designs.length}
          </span>
          <ChevronDown
            className="ms-auto size-4 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <p className="px-4 pb-2 text-muted-foreground text-sm">{t('trash.hint')}</p>
        <ul className="divide-y border-t">
          {designs.map((design) => (
            <li key={design.id} className="flex items-center gap-3 p-3 sm:px-4">
              <div className="size-12 shrink-0 rounded-md bg-canvas p-1.5">
                <DesignThumbnail design={design} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{design.name}</p>
                <p className="truncate text-muted-foreground text-xs">
                  {t('trash.deletedAgo', {
                    time: formatRelativeTime(design.deletedAt ?? now, now, i18n.language),
                  })}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void actions.restore(design)}
                aria-label={`${t('common.restore')}: ${design.name}`}
              >
                <RotateCcw />
                <span className="hidden sm:inline">{t('common.restore')}</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirming(design)}
                aria-label={`${t('trash.deleteForever')}: ${design.name}`}
              >
                <Trash />
                <span className="hidden sm:inline">{t('trash.deleteForever')}</span>
              </Button>
            </li>
          ))}
        </ul>
      </details>

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('trash.confirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('trash.confirmBody', { name: confirming?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirming) void actions.destroy(confirming);
                setConfirming(null);
              }}
            >
              {t('trash.deleteForever')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
