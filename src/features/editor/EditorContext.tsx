import { createContext, type ReactNode, useContext } from 'react';
import { useStore } from 'zustand';
import type { EditorState, EditorStore } from './editorStore';

const Context = createContext<EditorStore | null>(null);
export function EditorProvider({ store, children }: { store: EditorStore; children: ReactNode }) {
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useEditorStore(): EditorStore {
  const store = useContext(Context);
  if (!store) throw new Error('EditorProvider is missing');
  return store;
}
export function useEditor<T>(selector: (state: EditorState) => T): T {
  return useStore(useEditorStore(), selector);
}
