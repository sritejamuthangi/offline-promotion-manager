import { ExternalLink, Heart, ShieldCheck, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import { Logo } from '@/components/Logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { APP } from '@/config/app';

interface AboutDialogState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

/** Lets any screen (footer, settings, later the editor) open the About dialog. */
export const useAboutDialog = create<AboutDialogState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export function AboutDialog() {
  const { t } = useTranslation();
  const open = useAboutDialog((s) => s.open);
  const setOpen = useAboutDialog((s) => s.setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center sm:items-start sm:text-start">
          <Logo className="mb-1 size-12" />
          <DialogTitle>{t('about.title', { appName: APP.name })}</DialogTitle>
          <DialogDescription>{t('about.version', { version: APP.version })}</DialogDescription>
        </DialogHeader>

        <p className="text-sm">{t('about.description')}</p>

        <div className="rounded-lg bg-muted/60 p-4">
          <h3 className="mb-2 font-medium text-sm">{t('about.privacyTitle')}</h3>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {t('about.privacyLocal')}
            </li>
            <li className="flex gap-2">
              <Heart className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {t('about.privacyNoAccount')}
            </li>
            <li className="flex gap-2">
              <WifiOff className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              {t('about.privacyOffline')}
            </li>
          </ul>
        </div>

        <p className="text-muted-foreground text-sm">{t('about.license')}</p>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
          <span>
            {t('about.builtBy')}{' '}
            <a
              href={APP.author.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              {APP.author.name}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </span>
          {APP.repositoryUrl && (
            <a
              href={APP.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              {t('about.sourceCode')}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
