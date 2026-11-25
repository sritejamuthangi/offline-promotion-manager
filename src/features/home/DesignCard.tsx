import { Link } from '@tanstack/react-router';
import { Copy, Ellipsis, Pencil, SquareArrowOutUpRight, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Design } from '@/core/schema';
import { formatSize } from '@/core/units';
import { DesignThumbnail } from '@/features/design/DesignThumbnail';
import { formatRelativeTime } from '@/lib/format';
import { useDesignActions } from './useDesignActions';

export function DesignCard({
  design,
  now,
  onRename,
}: {
  design: Design;
  now: number;
  onRename: (design: Design) => void;
}) {
  const { t, i18n } = useTranslation();
  const actions = useDesignActions();

  return (
    <article
      data-testid="design-card"
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition hover:shadow-md"
    >
      <Link
        to="/design/$designId"
        params={{ designId: design.id }}
        className="flex flex-1 flex-col rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <div className="aspect-[4/3] bg-canvas p-4">
          <DesignThumbnail design={design} />
        </div>
        <div className="flex flex-col gap-0.5 p-3 pe-11">
          <h3 className="truncate font-medium text-sm" title={design.name}>
            {design.name}
          </h3>
          <p className="truncate text-muted-foreground text-xs">
            {formatSize(design.width, design.height, design.unit, i18n.language)}
          </p>
          <p className="truncate text-muted-foreground text-xs">
            {t('home.edited', { time: formatRelativeTime(design.updatedAt, now, i18n.language) })}
          </p>
        </div>
      </Link>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute end-2 bottom-2"
            aria-label={`${t('common.moreActions')}: ${design.name}`}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to="/design/$designId" params={{ designId: design.id }}>
              <SquareArrowOutUpRight />
              {t('common.open')}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onRename(design)}>
            <Pencil />
            {t('common.rename')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void actions.duplicate(design)}>
            <Copy />
            {t('common.duplicate')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => void actions.remove(design)}>
            <Trash />
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}
