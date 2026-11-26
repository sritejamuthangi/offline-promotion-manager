import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, BookmarkPlus, Keyboard, Redo2, Undo2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ThemeMenu } from '@/app/theme';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NativeSelect } from '@/components/ui/native-select';
import type { InsertKind } from '@/core/design/elements';
import {
  createBackdropElement,
  createGridElement,
  createGridItem,
  createIconElement,
  createImageElement,
  createQrElement,
  createStickerElement,
} from '@/core/design/elements';
import { duplicateDesign } from '@/core/design/factory';
import {
  type Design,
  type DesignElement,
  type IconName,
  MAX_NAME_LENGTH,
  type StickerName,
} from '@/core/schema';
import { type ImageChoice, ImagePickerDialog } from '@/features/images/ImagePickerDialog';
import { SaveTemplateDialog } from '@/features/templates/SaveTemplateDialog';
import { useMediaQuery } from '@/lib/hooks';
import { designRepository } from '@/storage';
import { DesignConflictError, DesignNotFoundError } from '@/storage/repositories';
import { EditorCanvas } from './EditorCanvas';
import { EditorProvider, useEditor, useEditorStore } from './EditorContext';
import { type EditorPanel, EditorToolbar } from './EditorToolbar';
import { ElementsDialog } from './ElementsDialog';
import { createEditorStore } from './editorStore';
import { Inspector } from './Inspector';
import { LayersPanel } from './LayersPanel';
import { QrDialog } from './QrDialog';
import { StylesPanel } from './StylesPanel';
import { useEditorPersistence } from './useEditorPersistence';
import { useEditorShortcuts } from './useEditorShortcuts';

export function EditorWorkspace({ design }: { design: Design }) {
  const [store] = useState(() => createEditorStore(design));
  return (
    <EditorProvider store={store}>
      <Workspace />
    </EditorProvider>
  );
}

function Workspace() {
  const { t } = useTranslation();
  const store = useEditorStore();
  const navigate = useNavigate();
  const past = useEditor((s) => s.past.length);
  const future = useEditor((s) => s.future.length);
  const pages = useEditor((s) => s.doc.pages);
  const pageIndex = useEditor((s) => s.pageIndex);
  const [hand, setHand] = useState(false);
  const [space, setSpace] = useState(false);
  const [multi, setMulti] = useState(false);
  const [snapping, setSnapping] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [panel, setPanel] = useState<EditorPanel>('properties');
  const [panelOpen, setPanelOpen] = useState<boolean | null>(null);
  const largeScreen = useMediaQuery('(min-width: 1024px)');
  const visiblePanel = panelOpen ?? largeScreen;
  const [help, setHelp] = useState(false);
  const [elementsOpen, setElementsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<Design | null>(null);
  const theme = useEditor((s) => s.doc.theme);
  const pageWidth = useEditor((s) => s.doc.width);
  const pageHeight = useEditor((s) => s.doc.height);
  const { state: saveState, flush } = useEditorPersistence(store);
  const insert = useCallback(
    (kind: InsertKind) => {
      store.getState().commit();
      setEditing(null);
      setHand(false);
      store.getState().insert(kind, t('editor.defaultText'));
    },
    [store, t],
  );
  const insertElement = useCallback(
    (element: DesignElement, position?: 'front' | 'back') => {
      store.getState().commit();
      setEditing(null);
      setHand(false);
      store.getState().insertElement(element, position);
    },
    [store],
  );
  const addImage = useCallback(
    (choice: ImageChoice) => {
      const doc = store.getState().doc;
      // Backgrounds cover the page and go behind everything already there.
      if (choice.adaptive) insertElement(createBackdropElement(doc, choice.src), 'back');
      else insertElement(createImageElement(doc, choice));
    },
    [insertElement, store],
  );
  const addGrid = useCallback(() => {
    const names = [
      t('editor.gridSample.design'),
      t('editor.gridSample.print'),
      t('editor.gridSample.brand'),
      t('editor.gridSample.web'),
      t('editor.gridSample.photo'),
    ];
    insertElement(
      createGridElement(
        store.getState().doc,
        names.map((name) => createGridItem(name)),
      ),
    );
  }, [insertElement, store, t]);
  const addIcon = useCallback(
    (icon: IconName) => insertElement(createIconElement(store.getState().doc, icon)),
    [insertElement, store],
  );
  const addSticker = useCallback(
    (sticker: StickerName) => insertElement(createStickerElement(store.getState().doc, sticker)),
    [insertElement, store],
  );
  const addQr = useCallback(
    (value: string) => insertElement(createQrElement(store.getState().doc, value)),
    [insertElement, store],
  );
  useEditorShortcuts({ store, setSpace, setEditing, insert, save: flush });

  const leave = async () => {
    if (await flush()) await navigate({ to: '/' });
  };
  const saveCopy = async () => {
    store.getState().commit();
    const source = store.getState().doc;
    const copy = duplicateDesign(source, { name: t('design.copyName', { name: source.name }) });
    try {
      await designRepository.save(copy);
      await navigate({ to: '/design/$designId', params: { designId: copy.id } });
    } catch {
      toast.error(t('editor.saveError'));
    }
  };
  const openPanel = (next: EditorPanel) => {
    store.getState().commit();
    setPanel(next);
    setPanelOpen(panel !== next || !visiblePanel);
  };

  return (
    <div className="flex h-dvh min-w-0 flex-col overflow-hidden bg-background" data-testid="editor">
      <header className="flex h-14 shrink-0 items-center gap-1 border-b px-2 sm:gap-2 sm:px-4">
        <Button asChild variant="ghost" size="icon">
          <Link
            to="/"
            aria-label={t('nav.backToHome')}
            onClick={(event) => {
              event.preventDefault();
              void leave();
            }}
          >
            <ArrowLeft className="rtl:rotate-180" />
          </Link>
        </Button>
        <DesignName />
        <span
          role="status"
          data-testid="save-status"
          className="hidden min-w-0 truncate text-muted-foreground text-xs md:inline"
        >
          {t(`editor.saveStatus.${saveState.status}`)}
        </span>
        <div className="ms-auto flex items-center gap-0.5">
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={!past}
            aria-label={t('common.undo')}
            title={t('common.undo')}
            onClick={() => store.getState().undo()}
          >
            <Undo2 />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={!future}
            aria-label={t('editor.redo')}
            title={t('editor.redo')}
            onClick={() => store.getState().redo()}
          >
            <Redo2 />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t('editor.saveAsTemplate')}
            title={t('editor.saveAsTemplate')}
            onClick={() => {
              store.getState().commit();
              setTemplateDraft(store.getState().doc);
            }}
          >
            <BookmarkPlus />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t('editor.shortcuts')}
            title={t('editor.shortcuts')}
            onClick={() => setHelp(true)}
          >
            <Keyboard />
          </Button>
          <div className="hidden sm:block">
            <ThemeMenu />
          </div>
        </div>
      </header>
      <div className="flex items-center justify-between border-b px-3 py-1.5 text-xs md:hidden">
        <span role="status" data-testid="mobile-save-status" className="text-muted-foreground">
          {t(`editor.saveStatus.${saveState.status}`)}
        </span>
        <div className="flex gap-3">
          <button type="button" onClick={() => openPanel('properties')}>
            {t('editor.properties')}
          </button>
          <button type="button" onClick={() => openPanel('layers')}>
            {t('editor.layers')}
          </button>
          <button type="button" onClick={() => openPanel('styles')}>
            {t('editor.styles')}
          </button>
        </div>
      </div>
      {saveState.status === 'error' && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 border-b bg-destructive/10 px-4 py-2 text-sm"
        >
          <span className="flex-1">
            {t(
              saveState.error instanceof DesignConflictError
                ? 'editor.saveConflict'
                : saveState.error instanceof DesignNotFoundError
                  ? 'editor.saveDeleted'
                  : 'editor.saveError',
            )}
          </span>
          <Button size="sm" variant="outline" onClick={() => void flush()}>
            {t('editor.retry')}
          </Button>
          <Button size="sm" onClick={() => void saveCopy()}>
            {t('editor.saveCopy')}
          </Button>
        </div>
      )}
      <EditorToolbar
        hand={hand}
        setHand={setHand}
        multi={multi}
        setMulti={setMulti}
        snapping={snapping}
        setSnapping={setSnapping}
        panel={panel}
        panelOpen={visiblePanel}
        openPanel={openPanel}
        insert={insert}
        onOpenImages={() => setImagesOpen(true)}
        onOpenElements={() => setElementsOpen(true)}
        onOpenQr={() => setQrOpen(true)}
        onAddGrid={addGrid}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        <EditorCanvas
          hand={hand}
          space={space}
          multi={multi}
          snapping={snapping}
          editing={editing}
          setEditing={setEditing}
        />
        {visiblePanel && (
          <aside
            aria-label={t('editor.sidePanel')}
            className="flex max-h-[42dvh] shrink-0 flex-col border-t bg-background lg:max-h-none lg:w-72 lg:border-t-0 lg:border-s"
          >
            <div className="flex items-center gap-1 border-b p-2">
              <Button
                size="sm"
                variant={panel === 'properties' ? 'secondary' : 'ghost'}
                onClick={() => setPanel('properties')}
              >
                {t('editor.properties')}
              </Button>
              <Button
                size="sm"
                variant={panel === 'layers' ? 'secondary' : 'ghost'}
                onClick={() => setPanel('layers')}
              >
                {t('editor.layers')}
              </Button>
              <Button
                size="sm"
                variant={panel === 'styles' ? 'secondary' : 'ghost'}
                onClick={() => setPanel('styles')}
              >
                {t('editor.styles')}
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                className="ms-auto"
                aria-label={t('editor.closePanel')}
                onClick={() => setPanelOpen(false)}
              >
                <X />
              </Button>
            </div>
            <div className="min-h-0 overflow-y-auto">
              {panel === 'properties' && <Inspector />}
              {panel === 'layers' && <LayersPanel multi={multi} />}
              {panel === 'styles' && <StylesPanel />}
            </div>
          </aside>
        )}
      </main>
      {pages.length > 1 && (
        <div className="flex shrink-0 items-center gap-2 border-t px-3 py-2 text-sm">
          <label htmlFor="editor-page-select">{t('editor.page')}</label>
          <NativeSelect
            id="editor-page-select"
            value={pageIndex}
            onChange={(e) => {
              setEditing(null);
              store.getState().setPage(Number(e.target.value));
            }}
          >
            {pages.map((page, i) => (
              <option key={page.id} value={i}>
                {page.name || t('editor.pageNumber', { number: i + 1 })}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editor.shortcuts')}</DialogTitle>
            <DialogDescription>{t('editor.shortcutsHint')}</DialogDescription>
          </DialogHeader>
          <dl className="space-y-3 text-sm">
            {[
              ['move', 'Drag'],
              ['pan', 'Space + drag'],
              ['zoom', 'Ctrl/⌘ + scroll'],
              ['multi', 'Shift + click'],
              ['nudge', '← ↑ ↓ → / Shift'],
              ['undo', 'Ctrl/⌘ + Z'],
              ['redo', 'Ctrl/⌘ + Shift + Z'],
              ['duplicate', 'Ctrl/⌘ + D'],
              ['copy', 'Ctrl/⌘ + C / V'],
              ['all', 'Ctrl/⌘ + A'],
              ['remove', 'Delete'],
              ['constrain', 'Shift'],
              ['center', 'Alt'],
              ['text', 'T / R / O / L'],
              ['finish', 'Ctrl/⌘ + Enter'],
            ].map(([key, shortcut]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <dt>
                  {t(
                    `editor.keys.${key as keyof typeof import('@/i18n/locales/en.json')['editor']['keys']}`,
                  )}
                </dt>
                <dd className="rounded bg-muted px-2 py-1 text-xs">{shortcut}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
      <ElementsDialog
        open={elementsOpen}
        onOpenChange={setElementsOpen}
        onInsertIcon={addIcon}
        onInsertSticker={addSticker}
      />
      <QrDialog open={qrOpen} onOpenChange={setQrOpen} onInsert={addQr} />
      <ImagePickerDialog
        open={imagesOpen}
        onOpenChange={setImagesOpen}
        onPick={addImage}
        theme={theme}
        frame={{ width: pageWidth, height: pageHeight }}
      />
      <SaveTemplateDialog design={templateDraft} onClose={() => setTemplateDraft(null)} />
    </div>
  );
}

function DesignName() {
  const { t } = useTranslation();
  const store = useEditorStore();
  const name = useEditor((s) => s.doc.name);
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  return (
    <input
      aria-label={t('design.nameLabel')}
      maxLength={MAX_NAME_LENGTH}
      value={focused ? draft : name}
      className="h-9 min-w-0 max-w-sm flex-1 truncate rounded-md border border-transparent bg-transparent px-2 text-base font-medium outline-none hover:border-input focus:ring-2 focus:ring-ring sm:text-sm"
      onFocus={() => {
        setDraft(name);
        setFocused(true);
        setCancelling(false);
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setFocused(false);
        if (!cancelling && draft.trim() && draft.trim() !== name) {
          store.getState().rename(draft);
          toast.success(t('design.renamed'));
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          const input = e.currentTarget;
          setCancelling(true);
          requestAnimationFrame(() => input.blur());
        }
      }}
    />
  );
}
