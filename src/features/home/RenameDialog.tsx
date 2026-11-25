import { type FormEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Design, MAX_NAME_LENGTH } from '@/core/schema';
import { useDesignActions } from './useDesignActions';

export function RenameDialog({ design, onClose }: { design: Design | null; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Dialog open={design !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('design.renameTitle')}</DialogTitle>
        </DialogHeader>
        {/* Keyed so the field starts with the current name every time it opens. */}
        {design && <RenameForm key={design.id} design={design} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function RenameForm({ design, onDone }: { design: Design; onDone: () => void }) {
  const { t } = useTranslation();
  const actions = useDesignActions();
  const [name, setName] = useState(design.name);
  const [saving, setSaving] = useState(false);
  const inputId = useId();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (name.trim() === design.name) {
      onDone();
      return;
    }
    setSaving(true);
    const ok = await actions.rename(design, name);
    setSaving(false);
    if (ok) onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={inputId}>{t('design.nameLabel')}</Label>
        <Input
          id={inputId}
          value={name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t('common.cancel')}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={saving || !name.trim()}>
          {t('common.save')}
        </Button>
      </DialogFooter>
    </form>
  );
}
