import { Link, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { Design } from '@/core/schema';
import { EditorWorkspace } from '@/features/editor/EditorWorkspace';
import { useDesignActions } from '@/features/home/useDesignActions';
import { useDesign } from '@/storage/hooks';

export function DesignPage() {
  const { designId } = useParams({ from: '/design/$designId' });
  return <DesignSession key={designId} designId={designId} />;
}

function DesignSession({ designId }: { designId: string }) {
  const { t } = useTranslation();
  const design = useDesign(designId);
  const actions = useDesignActions();
  const [opened, setOpened] = useState<Design | null>(null);
  // Keep the open editor alive if another tab deletes its source, so local work can be saved as a copy.
  if (!opened && design && design.deletedAt === undefined) setOpened(design);
  if (opened) return <EditorWorkspace design={opened} />;
  if (design === undefined)
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  if (!design || design.deletedAt !== undefined)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="font-semibold text-xl">
          {t(design ? 'design.inTrash' : 'design.notFoundTitle')}
        </h1>
        {!design && <p className="max-w-sm text-muted-foreground">{t('design.notFoundBody')}</p>}
        {design && (
          <Button onClick={() => void actions.restore(design)}>{t('common.restore')}</Button>
        )}
        <Button asChild variant="outline">
          <Link to="/">{t('nav.backToHome')}</Link>
        </Button>
      </div>
    );
  return <EditorWorkspace key={designId} design={design} />;
}
