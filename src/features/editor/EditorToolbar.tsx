import {
  ChevronDown,
  Copy,
  Hand,
  ImagePlus,
  Layers,
  LayoutGrid,
  Magnet,
  MousePointer2,
  Palette,
  QrCode,
  SlidersHorizontal,
  Sparkles,
  Square,
  SquareMousePointer,
  Trash,
  Type,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { InsertKind } from '@/core/design/elements';
import { SHAPE_KINDS } from '@/core/schema';
import { useEditor, useEditorStore } from './EditorContext';

export type EditorPanel = 'properties' | 'layers' | 'styles';

export function EditorToolbar({
  hand,
  setHand,
  multi,
  setMulti,
  snapping,
  setSnapping,
  panel,
  panelOpen,
  openPanel,
  insert,
  onOpenImages,
  onOpenElements,
  onOpenQr,
  onAddGrid,
}: {
  hand: boolean;
  setHand: (hand: boolean) => void;
  multi: boolean;
  setMulti: (multi: boolean) => void;
  snapping: boolean;
  setSnapping: (snap: boolean) => void;
  panel: EditorPanel;
  panelOpen: boolean;
  openPanel: (panel: EditorPanel) => void;
  insert: (kind: InsertKind) => void;
  onOpenImages: () => void;
  onOpenElements: () => void;
  onOpenQr: () => void;
  onAddGrid: () => void;
}) {
  const { t } = useTranslation();
  const store = useEditorStore();
  const count = useEditor((s) => s.selection.length);
  return (
    <div
      role="toolbar"
      aria-label={t('editor.tools')}
      className="flex shrink-0 items-center gap-1 overflow-x-auto border-b bg-background px-2 py-2 scrollbar-none sm:px-4"
    >
      <Button
        size="icon"
        variant={hand ? 'ghost' : 'secondary'}
        aria-label={t('editor.selectTool')}
        title={t('editor.selectTool')}
        aria-pressed={!hand}
        onClick={() => setHand(false)}
      >
        <MousePointer2 />
      </Button>
      <Button
        size="icon"
        variant={hand ? 'secondary' : 'ghost'}
        aria-label={t('editor.panTool')}
        title={t('editor.panTool')}
        aria-pressed={hand}
        onClick={() => setHand(!hand)}
      >
        <Hand />
      </Button>
      <Button
        size="icon"
        variant={multi ? 'secondary' : 'ghost'}
        aria-label={t('editor.multiSelect')}
        title={t('editor.multiSelect')}
        aria-pressed={multi}
        onClick={() => setMulti(!multi)}
      >
        <SquareMousePointer />
      </Button>
      <span className="mx-1 h-6 border-s" />
      <Button size="sm" variant="ghost" onClick={() => insert('text')}>
        <Type />
        {t('editor.addText')}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost">
            <Square />
            {t('editor.addShape')}
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {SHAPE_KINDS.map((shape) => (
            <DropdownMenuItem key={shape} onSelect={() => insert(shape)}>
              {t(`editor.shapes.${shape}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="sm" variant="ghost" onClick={() => insert('line')}>
        {t('editor.addLine')}
      </Button>
      <Button size="sm" variant="ghost" onClick={onOpenImages}>
        <ImagePlus />
        {t('editor.images')}
      </Button>
      <Button size="sm" variant="ghost" onClick={onOpenElements}>
        <Sparkles />
        {t('editor.elements')}
      </Button>
      <Button size="sm" variant="ghost" onClick={onOpenQr}>
        <QrCode />
        {t('editor.qrCode')}
      </Button>
      <Button size="sm" variant="ghost" onClick={onAddGrid}>
        <LayoutGrid />
        {t('editor.smartGrid')}
      </Button>
      <span className="mx-1 h-6 border-s" />
      <Button
        size="icon"
        variant="ghost"
        disabled={!count}
        aria-label={t('common.duplicate')}
        title={t('common.duplicate')}
        onClick={() => store.getState().duplicateSelected()}
      >
        <Copy />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        disabled={!count}
        aria-label={t('common.delete')}
        title={t('common.delete')}
        onClick={() => store.getState().removeSelected()}
      >
        <Trash />
      </Button>
      <Button
        size="icon"
        variant={snapping ? 'secondary' : 'ghost'}
        aria-label={t('editor.snapping')}
        title={t('editor.snapping')}
        aria-pressed={snapping}
        onClick={() => setSnapping(!snapping)}
      >
        <Magnet />
      </Button>
      <span className="ms-auto" />
      <Button
        size="sm"
        variant={panelOpen && panel === 'properties' ? 'secondary' : 'ghost'}
        aria-pressed={panelOpen && panel === 'properties'}
        onClick={() => openPanel('properties')}
      >
        <SlidersHorizontal />
        {t('editor.properties')}
      </Button>
      <Button
        size="sm"
        variant={panelOpen && panel === 'layers' ? 'secondary' : 'ghost'}
        aria-pressed={panelOpen && panel === 'layers'}
        onClick={() => openPanel('layers')}
      >
        <Layers />
        {t('editor.layers')}
      </Button>
      <Button
        size="sm"
        variant={panelOpen && panel === 'styles' ? 'secondary' : 'ghost'}
        aria-pressed={panelOpen && panel === 'styles'}
        onClick={() => openPanel('styles')}
      >
        <Palette />
        {t('editor.styles')}
      </Button>
    </div>
  );
}
