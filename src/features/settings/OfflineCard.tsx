import {
  CheckCircle2,
  Download,
  LoaderCircle,
  MonitorDown,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { FontsManifest } from '@/pwa/constants';
import { loadFontsManifest, saveAllFonts, savedFontCount } from '@/pwa/fonts';
import { isAppleMobile, promptInstall, usePwa } from '@/pwa/register';

/** Offline use: whether the app is saved, installing it, and saving every font. */
export function OfflineCard() {
  const { t } = useTranslation();
  const status = usePwa((s) => s.status);
  const installPrompt = usePwa((s) => s.installPrompt);
  const installed = usePwa((s) => s.installed);
  const ready = status === 'ready';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WifiOff className="size-4 text-muted-foreground" aria-hidden="true" />
          {t('offline.title')}
        </CardTitle>
        <CardDescription>{t('offline.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 text-sm">
        <p
          data-testid="offline-status"
          className={cn(
            'flex items-start gap-2',
            ready ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
          )}
        >
          {ready ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : status === 'preparing' ? (
            <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          {t(`offline.status.${status}`)}
        </p>
        <div className="grid gap-2">
          <h3 className="font-medium">{t('offline.installTitle')}</h3>
          {installed ? (
            <p className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t('offline.installed')}
            </p>
          ) : installPrompt ? (
            <Button
              variant="outline"
              size="sm"
              className="justify-self-start"
              onClick={() => void promptInstall()}
            >
              <MonitorDown />
              {t('offline.install')}
            </Button>
          ) : (
            <p className="text-muted-foreground">
              {isAppleMobile() ? t('offline.installApple') : t('offline.installHint')}
            </p>
          )}
        </div>
        <SaveFonts />
      </CardContent>
    </Card>
  );
}

function SaveFonts() {
  const { t, i18n } = useTranslation();
  const [manifest, setManifest] = useState<FontsManifest | null>(null);
  const [saved, setSaved] = useState(0);
  const [saving, setSaving] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const loaded = await loadFontsManifest();
      if (!loaded || !('caches' in window)) return;
      const count = await savedFontCount(loaded).catch(() => 0);
      if (!active) return;
      setManifest(loaded);
      setSaved(count);
    })();
    return () => {
      active = false;
      abort.current?.abort();
    };
  }, []);

  // Outside the built app there is no list of font files to save.
  if (!manifest) return null;
  const total = manifest.files.length;
  const done = saved >= total;

  const save = async () => {
    const controller = new AbortController();
    abort.current = controller;
    setSaving(true);
    try {
      await saveAllFonts(manifest, setSaved, controller.signal);
      toast.success(t('offline.fontsSaved'));
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('Saving fonts failed', error);
      toast.error(t('offline.fontsFailed'));
    } finally {
      if (!controller.signal.aborted) setSaving(false);
    }
  };

  return (
    <div className="grid gap-2">
      <h3 className="font-medium">{t('offline.fontsTitle')}</h3>
      <p className="text-muted-foreground">
        {t('offline.fontsBody', { size: formatBytes(manifest.bytes, i18n.language) })}
      </p>
      {done ? (
        <p
          data-testid="fonts-saved"
          className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t('offline.fontsDone')}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? <LoaderCircle className="animate-spin" /> : <Download />}
            {saving
              ? t('offline.fontsSaving', { percent: Math.floor((saved / total) * 100) })
              : t('offline.fontsSave')}
          </Button>
          {saving ? (
            <progress
              className="h-2 w-40 accent-primary"
              max={total}
              value={saved}
              aria-label={t('offline.fontsTitle')}
            />
          ) : (
            saved > 0 && (
              <span className="text-muted-foreground">
                {t('offline.fontsPartial', { saved, total })}
              </span>
            )
          )}
        </div>
      )}
    </div>
  );
}
