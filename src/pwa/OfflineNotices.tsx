import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { applyUpdate, usePwa } from './register';

/** Remembers that the "ready to work offline" message was shown on this device. */
const READY_SHOWN_KEY = 'opm-offline-ready';

/** Tells people once that the app works offline, and when a new version is ready. */
export function OfflineNotices() {
  const { t } = useTranslation();
  const status = usePwa((s) => s.status);
  const update = usePwa((s) => s.update);

  useEffect(() => {
    if (status !== 'ready') return;
    try {
      if (localStorage.getItem(READY_SHOWN_KEY)) return;
      localStorage.setItem(READY_SHOWN_KEY, '1');
    } catch {
      return; // Storage unavailable: don't repeat the message on every visit.
    }
    toast.success(t('offline.readyToast'));
  }, [status, t]);

  useEffect(() => {
    if (!update) return;
    const id = toast(t('offline.updateToast'), {
      duration: Number.POSITIVE_INFINITY,
      action: { label: t('offline.update'), onClick: applyUpdate },
    });
    return () => {
      toast.dismiss(id);
    };
  }, [update, t]);

  return null;
}
