import { Pencil, Trash } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import { MAX_NAME_LENGTH, THEME_COLOR_KEYS } from '@/core/schema';
import { formatSize } from '@/core/units';
import { DesignThumbnail } from '@/features/design/DesignThumbnail';
import { templateRepository } from '@/storage';
import { type CatalogItem, useCreateFromTemplate } from './catalog';

/** A large preview of a template, with the button that starts a design from it. */
export function TemplatePreviewDialog({
  item,
  onClose,
}: {
  item: CatalogItem | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        {/* Keyed so rename and delete states reset for each template. */}
        {item && <Preview key={item.key} item={item} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function Preview({ item, onClose }: { item: CatalogItem; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { create, creating } = useCreateFromTemplate();
  const [mode, setMode] = useState<'view' | 'rename' | 'delete'>('view');
  const design = item.preview;
  const details = [
    item.kind === 'saved' ? t('templates.savedHere') : t(`templates.categories.${item.category}`),
    formatSize(design.width, design.height, design.unit, i18n.language),
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="h-[46dvh] rounded-lg bg-canvas p-4 sm:h-[62dvh]">
        <DesignThumbnail design={design} />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="leading-tight">{item.name}</DialogTitle>
          <DialogDescription>{details.join(' · ')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex h-6 overflow-hidden rounded-md ring-1 ring-black/10 dark:ring-white/10">
            {THEME_COLOR_KEYS.map((key) => (
              <span
                key={key}
                title={t(`styles.slots.${key}`)}
                className="flex-1"
                style={{ backgroundColor: design.theme.colors[key] }}
              />
            ))}
          </div>
          <p className="text-muted-foreground">
            {design.theme.fonts.heading === design.theme.fonts.body
              ? design.theme.fonts.heading
              : `${design.theme.fonts.heading} · ${design.theme.fonts.body}`}
          </p>
        </div>
        <Button
          size="lg"
          className="mt-auto"
          disabled={creating !== null}
          onClick={() => void create(item)}
        >
          {creating ? t('templates.opening') : t('templates.use')}
        </Button>
        {item.kind === 'saved' && mode === 'view' && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setMode('rename')}>
              <Pencil />
              {t('common.rename')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setMode('delete')}
            >
              <Trash />
              {t('common.delete')}
            </Button>
          </div>
        )}
        {item.kind === 'saved' && mode === 'rename' && (
          <RenameTemplateForm
            id={item.saved.id}
            name={item.saved.name}
            onDone={() => setMode('view')}
          />
        )}
        {item.kind === 'saved' && mode === 'delete' && (
          <div role="alert" className="space-y-3 rounded-lg border border-destructive/40 p-3">
            <p className="font-medium text-sm">{t('templates.deleteTitle')}</p>
            <p className="text-muted-foreground text-sm">
              {t('templates.deleteBody', { name: item.saved.name })}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setMode('view')}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  templateRepository
                    .remove(item.saved.id)
                    .then(() => {
                      toast.success(t('templates.deleted'));
                      onClose();
                    })
                    .catch(() => toast.error(t('templates.actionFailed')));
                }}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RenameTemplateForm({
  id,
  name: initial,
  onDone,
}: {
  id: string;
  name: string;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const inputId = useId();
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await templateRepository.rename(id, name);
      toast.success(t('templates.renamed'));
      onDone();
    } catch {
      toast.error(t('templates.actionFailed'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit} className="grid gap-2">
      <Label htmlFor={inputId}>{t('templates.nameLabel')}</Label>
      <Input
        id={inputId}
        value={name}
        maxLength={MAX_NAME_LENGTH}
        onChange={(event) => setName(event.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={saving || !name.trim()}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
