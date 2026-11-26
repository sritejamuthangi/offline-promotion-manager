import { useEffect } from 'react';
import type { InsertKind } from '@/core/design/elements';
import { type EditorStore, editableElements, pageElements } from './editorStore';

export function useEditorShortcuts({
  store,
  setSpace,
  setEditing,
  insert,
  save,
}: {
  store: EditorStore;
  setSpace: (space: boolean) => void;
  setEditing: (id: string | null) => void;
  insert: (kind: InsertKind) => void;
  save: () => Promise<boolean>;
}) {
  useEffect(() => {
    let nudging = false;
    const down = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented) return;
      const target = event.target as HTMLElement;
      if (target.closest('[role="dialog"],[role="menu"]')) return;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (mod && key === 's') {
        event.preventDefault();
        target.blur();
        void save();
        return;
      }
      if (target.closest('input,textarea,select,[contenteditable="true"]')) return;
      if (target.closest('button,a') && (key === ' ' || key === 'enter' || key.startsWith('arrow')))
        return;
      const state = store.getState();
      // Destructive and insertion keys only act when the canvas (or page) owns focus, so
      // keyboard users navigating the toolbar cannot accidentally change artwork.
      const canvasFocused =
        target === document.body || Boolean(target.closest('[role="application"]'));
      if (mod && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
      } else if (mod && key === 'y') {
        event.preventDefault();
        state.redo();
      } else if (mod && key === 'a') {
        event.preventDefault();
        state.select(
          pageElements(state)
            .filter((e) => !e.locked && !e.hidden)
            .map((e) => e.id),
        );
      } else if (mod && key === 'd') {
        event.preventDefault();
        state.duplicateSelected();
      } else if (mod && key === 'c') {
        event.preventDefault();
        state.copy();
      } else if (mod && key === 'v') {
        event.preventDefault();
        state.paste();
      } else if (key === 'escape') {
        state.cancel();
        state.select([]);
        setEditing(null);
      } else if (canvasFocused && (key === 'delete' || key === 'backspace')) {
        event.preventDefault();
        state.removeSelected();
      } else if (canvasFocused && key === ' ') {
        event.preventDefault();
        setSpace(true);
      } else if (canvasFocused && key.startsWith('arrow') && editableElements(state).length) {
        event.preventDefault();
        nudging = true;
        state.begin();
        const step = event.shiftKey ? 10 : 1;
        state.updateSelected((e) => {
          if (key === 'arrowleft') e.x -= step;
          if (key === 'arrowright') e.x += step;
          if (key === 'arrowup') e.y -= step;
          if (key === 'arrowdown') e.y += step;
        });
      } else if (canvasFocused && key === 'enter' && state.selection.length === 1) {
        const element = editableElements(state)[0];
        if (element?.type === 'text') {
          event.preventDefault();
          state.begin();
          setEditing(element.id);
        }
      } else if (canvasFocused && !mod && !event.altKey && !event.repeat) {
        const kind = (
          { t: 'text', r: 'rect', o: 'ellipse', l: 'line' } as Record<string, InsertKind>
        )[key];
        if (kind) {
          event.preventDefault();
          insert(kind);
        }
      }
    };
    const up = (event: KeyboardEvent) => {
      if (event.key === ' ') setSpace(false);
      if (event.key.startsWith('Arrow') && nudging) {
        store.getState().commit();
        nudging = false;
      }
    };
    const blur = () => {
      setSpace(false);
      if (nudging) store.getState().commit();
      nudging = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [store, setSpace, setEditing, insert, save]);
}
