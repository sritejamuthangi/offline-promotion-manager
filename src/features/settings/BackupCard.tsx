import { Archive, Download, LoaderCircle, TriangleAlert, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { APP } from '@/config/app';
import type { RestoreSummary } from '@/core/backup';
import { BackupError, type BackupFile, createBackupZip, readBackupZip } from '@/core/backupFile';
import { downloadBlob } from '@/lib/download';
import { collectBackupContents, db, previewRestore, restoreBackup } from '@/storage';

type Progress = { done: number; total: number };

/** Downloads a backup of everything, and restores backups or design files. */
export function BackupCard() {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'backup' | 'reading' | 'restoring' | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<BackupFile | null>(null);
  const [preview, setPreview] = useState<{ summary: RestoreSummary; issues: number } | null>(null);

  const message = (cause: unknown): string => {
    if (cause instanceof BackupError) {
      if (cause.code === 'newerVersion') return t('backup.errors.newerVersion');
      if (cause.code === 'notBackup') return t('backup.errors.notBackup');
      return t('backup.errors.damaged');
    }
    if (cause instanceof DOMException && cause.name === 'QuotaExceededError')
      return t('backup.errors.quota');
    return t('backup.errors.failed');
  };

  const download = async () => {
    setBusy('backup');
    setError(null);
    try {
      const contents = await collectBackupContents(db);
      const zip = await createBackupZip(contents, { kind: 'backup', app: APP.name });
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(zip, `offline-promotion-manager-backup-${date}.zip`);
      toast.success(t('backup.downloaded'));
    } catch (cause) {
      console.error('Backup failed', cause);
      toast.error(message(cause));
    } finally {
      setBusy(null);
    }
  };

  const open = async (chosen: File) => {
    setBusy('reading');
    setError(null);
    setProgress(null);
    try {
      const parsed = await readBackupZip(chosen, (done, total) => setProgress({ done, total }));
      const summary = await previewRestore(db, parsed, {
        copyName: (name) => t('backup.copyName', { name }),
      });
      setFile(parsed);
      setPreview({ summary, issues: parsed.issues.length });
    } catch (cause) {
      console.error('Opening the backup failed', cause);
      setError(message(cause));
    } finally {
      setBusy(null);
      setProgress(null);
      if (input.current) input.current.value = '';
    }
  };

  const restore = async () => {
    if (!file) return;
    setBusy('restoring');
    setError(null);
    try {
      const summary = await restoreBackup(db, file, {
        copyName: (name) => t('backup.copyName', { name }),
        onProgress: (done, total) => setProgress({ done, total }),
      });
      toast.success(
        t('backup.restored', {
          designs: t('backup.addedDesigns', { count: summary.designs }),
          templates: t('backup.addedTemplates', { count: summary.templates }),
        }),
      );
      setFile(null);
      setPreview(null);
    } catch (cause) {
      console.error('Restore failed', cause);
      setError(message(cause));
    } finally {
      setBusy(null);
      setProgress(null);
    }
  };

  const percent = progress && progress.total > 0 ? (progress.done / progress.total) * 100 : null;

  return (
    <Card data-testid="backup-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="size-4 text-muted-foreground" aria-hidden="true" />
          {t('backup.title')}
        </CardTitle>
        <CardDescription>{t('backup.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <p className="text-muted-foreground">{t('backup.body')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => void download()}
          >
            {busy === 'backup' ? <LoaderCircle className="animate-spin" /> : <Download />}
            {busy === 'backup' ? t('backup.preparing') : t('backup.download')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => input.current?.click()}
          >
            {busy === 'reading' ? <LoaderCircle className="animate-spin" /> : <Upload />}
            {busy === 'reading' ? t('backup.reading') : t('backup.restore')}
          </Button>
          <input
            ref={input}
            type="file"
            accept=".zip,application/zip"
            className="sr-only"
            aria-label={t('backup.restore')}
            data-testid="backup-file"
            onChange={(event) => {
              const chosen = event.currentTarget.files?.[0];
              if (chosen) void open(chosen);
            }}
          />
        </div>
        {busy === 'reading' && percent !== null && (
          <div className="grid gap-1 text-muted-foreground">
            <p>{t('backup.readingImages', { done: progress?.done, total: progress?.total })}</p>
            <progress
              className="h-2 w-48 accent-primary"
              max={progress?.total}
              value={progress?.done}
              aria-label={t('backup.reading')}
            />
          </div>
        )}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </CardContent>

      <Dialog
        open={file !== null && preview !== null}
        onOpenChange={(next) => {
          if (!next && busy !== 'restoring') {
            setFile(null);
            setPreview(null);
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('backup.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('backup.confirmBody')}</DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="grid gap-3 text-sm" data-testid="restore-summary">
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
                <SummaryRow label={t('backup.designs')} value={preview.summary.designs} />
                <SummaryRow label={t('backup.templates')} value={preview.summary.templates} />
                <SummaryRow label={t('backup.images')} value={preview.summary.images} />
                <SummaryRow label={t('backup.existing')} value={preview.summary.existing} />
                <SummaryRow label={t('backup.copies')} value={preview.summary.copies} />
              </dl>
              {preview.issues > 0 && (
                <p className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {t('backup.issues', { count: preview.issues })}
                </p>
              )}
              {preview.summary.designs === 0 &&
                preview.summary.templates === 0 &&
                preview.summary.images === 0 && (
                  <p className="text-muted-foreground">{t('backup.nothingNew')}</p>
                )}
              {busy === 'restoring' && percent !== null && (
                <div className="grid gap-1 text-muted-foreground">
                  <p>
                    {t('backup.restoringImages', { done: progress?.done, total: progress?.total })}
                  </p>
                  <progress
                    className="h-2 w-full accent-primary"
                    max={progress?.total}
                    value={progress?.done}
                    aria-label={t('backup.restoring')}
                  />
                </div>
              )}
              {error && (
                <p role="alert" className="text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={busy === 'restoring'}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={busy === 'restoring'}
              data-testid="restore-confirm"
              onClick={() => void restore()}
            >
              {busy === 'restoring' && <LoaderCircle className="animate-spin" />}
              {busy === 'restoring' ? t('backup.restoring') : t('backup.restore')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </>
  );
}
