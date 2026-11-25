import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw, Sparkles } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeMenu } from '@/app/theme';
import { Button } from '@/components/ui/button';
import { type Design, MAX_NAME_LENGTH } from '@/core/schema';
import { formatSize } from '@/core/units';
import { useDesignActions } from '@/features/home/useDesignActions';
import { useDesign } from '@/storage/hooks';
import { DesignThumbnail } from './DesignThumbnail';

/** Opens a design. For now it shows the page; the full editor arrives in the next step. */
export function DesignPage() {
  const { t } = useTranslation();
  const { designId } = useParams({ from: '/design/$designId' });
  const design = useDesign(designId);

  if (design === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  if (design === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="font-semibold text-xl">{t('design.notFoundTitle')}</h1>
        <p className="max-w-sm text-muted-foreground">{t('design.notFoundBody')}</p>
        <Button asChild className="mt-2">
          <Link to="/">{t('nav.backToHome')}</Link>
        </Button>
      </div>
    );
  }

  return <DesignView design={design} />;
}

function DesignView({ design }: { design: Design }) {
  const { t, i18n } = useTranslation();
  const actions = useDesignActions();

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/" aria-label={t('nav.backToHome')}>
            <ArrowLeft className="rtl:rotate-180" />
          </Link>
        </Button>
        {/* Keyed so the field resets if the name changes elsewhere (e.g. another tab). */}
        <DesignNameField key={design.name} design={design} />
        <span className="hidden shrink-0 text-muted-foreground text-sm sm:inline">
          {formatSize(design.width, design.height, design.unit, i18n.language)}
        </span>
        <div className="ms-auto">
          <ThemeMenu />
        </div>
      </header>

      {design.deletedAt !== undefined && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-center gap-3 border-b bg-amber-100 px-4 py-2 text-amber-950 text-sm dark:bg-amber-950 dark:text-amber-100"
        >
          {t('design.inTrash')}
          <Button size="sm" variant="outline" onClick={() => void actions.restore(design)}>
            <RotateCcw />
            {t('common.restore')}
          </Button>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col items-center gap-6 p-4 sm:p-8">
        <div className="min-h-0 w-full max-w-4xl flex-1">
          <DesignThumbnail design={design} />
        </div>
        <div className="flex max-w-lg items-start gap-3 rounded-xl border bg-background p-4 shadow-sm">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-medium">{t('design.comingTitle')}</h2>
            <p className="mt-1 text-muted-foreground text-sm">{t('design.comingBody')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

/** The design name, editable in place. Saves on Enter or when the field loses focus. */
function DesignNameField({ design }: { design: Design }) {
  const { t } = useTranslation();
  const actions = useDesignActions();
  const [value, setValue] = useState(design.name);

  const commit = () => {
    const next = value.trim();
    if (!next) {
      setValue(design.name);
      return;
    }
    if (next !== design.name) void actions.rename(design, next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur();
    if (event.key === 'Escape') {
      setValue(design.name);
      // Wait for the reset to render before blurring, so the old name is not saved.
      requestAnimationFrame(() => event.currentTarget?.blur());
    }
  };

  return (
    <input
      aria-label={t('design.nameLabel')}
      value={value}
      maxLength={MAX_NAME_LENGTH}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      className="field-sizing-content h-9 min-w-24 max-w-[45vw] truncate rounded-md border border-transparent bg-transparent px-2 font-medium outline-none transition hover:border-input focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:max-w-md"
    />
  );
}
