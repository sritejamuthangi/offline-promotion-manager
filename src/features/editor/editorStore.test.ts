import { describe, expect, it } from 'vitest';
import { createDesign } from '@/core/design/factory';
import { createEditorStore, pageElements } from './editorStore';

const make = () =>
  createEditorStore(createDesign({ name: 'Poster', width: 800, height: 1000, unit: 'mm' }));

describe('editor history and selection', () => {
  it('records a continuous drag as one undo step, supports cancellation and redo branching', () => {
    const store = make();
    store.getState().insert('rect', '');
    const initialX = pageElements(store.getState())[0]?.x;
    store.getState().begin();
    for (let i = 0; i < 50; i++)
      store.getState().updateSelected((e) => {
        e.x = i;
      });
    expect(store.getState().past).toHaveLength(1);
    expect(store.getState().committed.pages[0]?.elements[0]?.x).toBe(initialX);
    store.getState().commit();
    expect(store.getState().past).toHaveLength(2);
    store.getState().undo();
    expect(pageElements(store.getState())[0]?.x).toBe(initialX);
    store.getState().redo();
    expect(pageElements(store.getState())[0]?.x).toBe(49);
    store.getState().begin();
    store.getState().updateSelected((e) => {
      e.x = 100;
    });
    store.getState().cancel();
    expect(pageElements(store.getState())[0]?.x).toBe(49);
    store.getState().undo();
    store.getState().updateSelected((e) => {
      e.y = 0;
    });
    expect(store.getState().future).toHaveLength(0);
  });

  it('keeps locked and hidden elements untouched by transforms and delete', () => {
    const store = make();
    store.getState().insert('rect', '');
    store.getState().updateSelected((e) => {
      e.locked = true;
    });
    const original = pageElements(store.getState())[0];
    store.getState().updateSelected((e) => {
      e.x = 0;
    });
    store.getState().removeSelected();
    expect(pageElements(store.getState())[0]).toEqual(original);
  });

  it('copies with new IDs, restores deleted elements and prunes invalid selection', () => {
    const store = make();
    store.getState().insert('text', 'Welcome');
    const first = pageElements(store.getState())[0];
    store.getState().copy();
    store.getState().paste();
    const copy = pageElements(store.getState())[1];
    expect(copy?.id).not.toBe(first?.id);
    expect(copy).toMatchObject({ type: 'text', text: 'Welcome' });
    store.getState().removeSelected();
    expect(store.getState().selection).toEqual([]);
    store.getState().undo();
    expect(pageElements(store.getState())).toHaveLength(2);
  });
});
