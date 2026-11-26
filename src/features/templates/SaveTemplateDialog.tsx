import { useNavigate } from '@tanstack/react-router';
import { type FormEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { type Design, MAX_NAME_LENGTH } from '@/core/schema';
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@/core/templates';
import { templateRepository } from '@/storage';

/** Saves a copy of a design as a reusable template on this device. */
export function SaveTemplateDialog({
  design,
  onClose,
}: {
  design: Design | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={design !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('templates.saveTitle')}</DialogTitle>
          <DialogDescription>{t('templates.saveDescription')}</DialogDescription>
        </DialogHeader>
        {design && <SaveTemplateForm key={design.id} design={design} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function SaveTemplateForm({ design, onDone }: { design: Design; onDone: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const nameId = useId();
  const categoryId = useId();
  const [name, setName] = useState(design.name);
  const [category, setCategory] = useState<TemplateCategory | ''>('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await templateRepository.create({ name, design, category: category || undefined });
      toast.success(t('templates.savedToast'), {
        action: {
          label: t('templates.view'),
          onClick: () => void navigate({ to: '/templates', search: { category: 'mine' } }),
        },
      });
      onDone();
    } catch (error) {
      console.error('Could not save the template', error);
      toast.error(t('templates.actionFailed'));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={nameId}>{t('templates.nameLabel')}</Label>
        <Input
          id={nameId}
          value={name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(event) => setName(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={categoryId}>{t('templates.categoryLabel')}</Label>
        <NativeSelect
          id={categoryId}
          value={category}
          onChange={(event) => setCategory(event.target.value as TemplateCategory | '')}
        >
          <option value="">{t('templates.noCategory')}</option>
          {TEMPLATE_CATEGORIES.map((key) => (
            <option key={key} value={key}>
              {t(`templates.categories.${key}`)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t('common.cancel')}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={saving || !name.trim()}>
          {t('templates.saveAction')}
        </Button>
      </DialogFooter>
    </form>
  );
}
