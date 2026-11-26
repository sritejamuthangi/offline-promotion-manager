import type { Design } from '@/core/schema';
import type { EditorStore } from './editorStore';

export interface SaveState {
  status: 'saved' | 'pending' | 'saving' | 'error';
  error?: unknown;
}

/** Debounced, serialized writes: an older slow write can never overwrite a newer edit. */
export function createAutosave(
  store: EditorStore,
  save: (doc: Design, expectedUpdatedAt: number) => Promise<void>,
  onStatus: (state: SaveState) => void,
  delay = 400,
) {
  let expectedUpdatedAt = store.getState().committed.updatedAt;
  let pending: Design | null = null;
  let running: Promise<boolean> | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let status: SaveState = { status: 'saved' };
  const notify = (next: SaveState) => {
    status = next;
    onStatus(next);
  };

  const write = async (): Promise<boolean> => {
    while (pending) {
      const document = pending;
      pending = null;
      notify({ status: 'saving' });
      try {
        await save(document, expectedUpdatedAt);
        expectedUpdatedAt = document.updatedAt;
      } catch (error) {
        pending ??= document;
        notify({ status: 'error', error });
        return false;
      }
    }
    notify({ status: 'saved' });
    return true;
  };

  const flush = (): Promise<boolean> => {
    clearTimeout(timer);
    if (running) return running;
    if (!pending) return Promise.resolve(true);
    running = write().finally(() => {
      running = null;
    });
    return running;
  };

  const unsubscribe = store.subscribe((next, previous) => {
    if (next.committed === previous.committed) return;
    pending = next.committed;
    clearTimeout(timer);
    notify({ status: 'pending' });
    timer = setTimeout(() => {
      void flush();
    }, delay);
  });

  return {
    flush,
    getStatus: () => status,
    /** Flush on navigation. The pending promise may finish after the screen unmounts. */
    dispose: () => {
      unsubscribe();
      clearTimeout(timer);
      void flush();
    },
  };
}
