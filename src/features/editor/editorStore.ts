import { type Draft, produce } from 'immer';
import { createStore } from 'zustand/vanilla';
import {
  type Alignment,
  alignmentOffsets,
  distributionOffsets,
  type LayerMove,
  reorderLayers,
} from '@/core/arrange';
import { createElement, type InsertKind } from '@/core/design/elements';
import { cleanDesignName } from '@/core/design/factory';
import { newId } from '@/core/ids';
import type { Design, DesignElement } from '@/core/schema';

const HISTORY_LIMIT = 100;
type Edit = (draft: Draft<Design>) => void;

export interface EditorState {
  doc: Design;
  /** Latest complete edit, which autosave can write while a new gesture is in progress. */
  committed: Design;
  selection: string[];
  pageIndex: number;
  past: Design[];
  future: Design[];
  transaction: Design | null;
  clipboard: DesignElement[];
  select: (ids: string[]) => void;
  setPage: (index: number) => void;
  edit: (recipe: Edit) => void;
  begin: () => void;
  commit: () => void;
  cancel: () => void;
  undo: () => void;
  redo: () => void;
  insert: (kind: InsertKind, text: string) => void;
  insertElement: (element: DesignElement) => void;
  updateSelected: (recipe: (element: Draft<DesignElement>) => void) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
  copy: () => void;
  paste: () => void;
  arrange: (alignment: Alignment, toPage?: boolean) => void;
  distribute: (axis: 'x' | 'y') => void;
  reorder: (move: LayerMove) => void;
  rename: (name: string) => void;
}

export const pageElements = (state: Pick<EditorState, 'doc' | 'pageIndex'>) =>
  state.doc.pages[state.pageIndex]?.elements ?? [];

export const selectedElements = (state: EditorState) =>
  pageElements(state).filter((e) => state.selection.includes(e.id));

export const editableElements = (state: EditorState) =>
  selectedElements(state).filter((e) => !e.locked && !e.hidden);

/** One isolated store per open design; history keeps structurally shared immutable snapshots. */
export function createEditorStore(initial: Design, clock: () => number = Date.now) {
  return createStore<EditorState>()((set, get) => {
    const stamp = (doc: Design) =>
      produce(doc, (draft) => {
        draft.updatedAt = Math.max(clock(), get().committed.updatedAt + 1);
      });
    const validSelection = (doc: Design) =>
      get().selection.filter((id) => doc.pages[get().pageIndex]?.elements.some((e) => e.id === id));
    const remember = (before: Design, after: Design) => {
      const doc = stamp(after);
      set((s) => ({
        doc,
        committed: doc,
        past: [...s.past, before].slice(-HISTORY_LIMIT),
        future: [],
        transaction: null,
        selection: validSelection(doc),
      }));
    };
    const pasteElements = (elements: DesignElement[]) => {
      if (!elements.length) return;
      const offset = Math.min(get().doc.width, get().doc.height) * 0.025;
      const copies = structuredClone(elements).map((e) => ({
        ...e,
        id: newId(),
        x: e.x + offset,
        y: e.y + offset,
        locked: false,
        hidden: false,
      }));
      get().edit((d) => {
        d.pages[get().pageIndex]?.elements.push(...copies);
      });
      get().select(copies.map((e) => e.id));
    };
    return {
      doc: initial,
      committed: initial,
      selection: [],
      pageIndex: 0,
      past: [],
      future: [],
      transaction: null,
      clipboard: [],
      select: (ids) => {
        const available = new Set(pageElements(get()).map((e) => e.id));
        set({ selection: [...new Set(ids)].filter((id) => available.has(id)) });
      },
      setPage: (index) => {
        if (!get().doc.pages[index]) return;
        get().commit();
        set({ pageIndex: index, selection: [] });
      },
      edit: (recipe) => {
        const before = get().doc;
        const after = produce(before, recipe);
        if (before === after) return;
        if (get().transaction) set({ doc: after });
        else remember(before, after);
      },
      begin: () => {
        if (!get().transaction) set({ transaction: get().doc });
      },
      commit: () => {
        const { transaction, doc } = get();
        if (!transaction) return;
        if (transaction === doc) set({ transaction: null });
        else remember(transaction, doc);
      },
      cancel: () => {
        const { transaction } = get();
        if (transaction) set({ doc: transaction, transaction: null });
      },
      undo: () => {
        get().commit();
        const s = get();
        const previous = s.past.at(-1);
        if (!previous) return;
        const doc = stamp(previous);
        set({
          doc,
          committed: doc,
          past: s.past.slice(0, -1),
          future: [...s.future, s.doc],
          selection: validSelection(doc),
        });
      },
      redo: () => {
        get().commit();
        const s = get();
        const next = s.future.at(-1);
        if (!next) return;
        const doc = stamp(next);
        set({
          doc,
          committed: doc,
          past: [...s.past, s.doc].slice(-HISTORY_LIMIT),
          future: s.future.slice(0, -1),
          selection: validSelection(doc),
        });
      },
      insert: (kind, text) => {
        const element = createElement(kind, get().doc, text);
        get().edit((d) => {
          d.pages[get().pageIndex]?.elements.push(element);
        });
        get().select([element.id]);
      },
      insertElement: (element) => {
        get().edit((d) => {
          d.pages[get().pageIndex]?.elements.push(element);
        });
        get().select([element.id]);
      },
      updateSelected: (recipe) => {
        const ids = new Set(editableElements(get()).map((e) => e.id));
        get().edit((d) => {
          for (const element of d.pages[get().pageIndex]?.elements ?? []) {
            if (ids.has(element.id)) recipe(element);
          }
        });
      },
      removeSelected: () => {
        const ids = new Set(editableElements(get()).map((e) => e.id));
        if (!ids.size) return;
        get().edit((d) => {
          const page = d.pages[get().pageIndex];
          if (page) page.elements = page.elements.filter((e) => !ids.has(e.id));
        });
      },
      duplicateSelected: () => pasteElements(editableElements(get())),
      copy: () => set({ clipboard: structuredClone(selectedElements(get())) }),
      paste: () => pasteElements(get().clipboard),
      arrange: (alignment, toPage = false) => {
        const selected = editableElements(get());
        const { width, height } = get().doc;
        const target = toPage || selected.length === 1 ? { x: 0, y: 0, width, height } : undefined;
        const offsets = alignmentOffsets(selected, alignment, target);
        get().updateSelected((e) => {
          const offset = offsets[selected.findIndex((item) => item.id === e.id)];
          if (offset) {
            e.x += offset.x;
            e.y += offset.y;
          }
        });
      },
      distribute: (axis) => {
        const selected = editableElements(get());
        const offsets = distributionOffsets(selected, axis);
        get().updateSelected((e) => {
          const offset = offsets[selected.findIndex((item) => item.id === e.id)];
          if (offset) {
            e.x += offset.x;
            e.y += offset.y;
          }
        });
      },
      reorder: (move) => {
        const ids = editableElements(get()).map((e) => e.id);
        get().edit((d) => {
          const page = d.pages[get().pageIndex];
          if (page) {
            const ordered = reorderLayers(page.elements, ids, move);
            if (ordered.some((e, i) => e.id !== page.elements[i]?.id)) page.elements = ordered;
          }
        });
      },
      rename: (name) =>
        get().edit((d) => {
          d.name = cleanDesignName(name, d.name);
        }),
    };
  });
}

export type EditorStore = ReturnType<typeof createEditorStore>;
