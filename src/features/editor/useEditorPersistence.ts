import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { designRepository } from '@/storage';
import { createAutosave, type SaveState } from './autosave';
import type { EditorStore } from './editorStore';

export function useEditorPersistence(store: EditorStore) {
  const [state, setState] = useState<SaveState>({ status: 'saved' });
  const inProgress = useStore(store, (s) => s.doc !== s.committed);
  const controller = useRef<ReturnType<typeof createAutosave> | null>(null);
  const flush = useCallback(async () => {
    store.getState().commit();
    return (await controller.current?.flush()) ?? true;
  }, [store]);

  useEffect(() => {
    let mounted = true;
    const autosave = createAutosave(store, designRepository.saveEdited, (next) => {
      if (mounted) setState(next);
    });
    controller.current = autosave;
    const hidden = () => {
      if (document.visibilityState === 'hidden') void flush();
    };
    const unload = (e: BeforeUnloadEvent) => {
      void flush();
      if (autosave.getStatus().status !== 'saved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const pagehide = () => {
      void flush();
    };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('beforeunload', unload);
    window.addEventListener('pagehide', pagehide);
    return () => {
      mounted = false;
      store.getState().commit();
      autosave.dispose();
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('beforeunload', unload);
      window.removeEventListener('pagehide', pagehide);
    };
  }, [store, flush]);
  const visibleState: SaveState =
    inProgress && state.status === 'saved' ? { status: 'pending' } : state;
  return { state: visibleState, flush };
}
