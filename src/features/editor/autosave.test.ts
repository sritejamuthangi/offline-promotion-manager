import { afterEach, expect, it, vi } from 'vitest';
import { createDesign } from '@/core/design/factory';
import type { Design } from '@/core/schema';
import { createAutosave } from './autosave';
import { createEditorStore } from './editorStore';

afterEach(() => vi.useRealTimers());
const make = () =>
  createEditorStore(createDesign({ name: 'Poster', width: 800, height: 1000, unit: 'mm' }));

it('debounces changes, serializes writes and catches up after a slow write', async () => {
  vi.useFakeTimers();
  const store = make();
  let release: (() => void) | undefined;
  const save = vi.fn(async (_doc: Design, _expected: number) => {
    if (save.mock.calls.length === 1)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
  });
  const autosave = createAutosave(store, save, () => {});
  store.getState().rename('First');
  store.getState().rename('Second');
  expect(save).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(400);
  expect(save).toHaveBeenCalledTimes(1);
  expect(save.mock.calls[0]?.[0].name).toBe('Second');
  store.getState().rename('Third');
  await vi.advanceTimersByTimeAsync(400);
  expect(save).toHaveBeenCalledTimes(1);
  release?.();
  await autosave.flush();
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1]?.[0].name).toBe('Third');
  expect(save.mock.calls[1]?.[1]).toBe(save.mock.calls[0]?.[0].updatedAt);
  autosave.dispose();
});

it('keeps failed work for retry and flushes committed changes on exit', async () => {
  const store = make();
  const save = vi.fn().mockRejectedValueOnce(new Error('quota')).mockResolvedValue(undefined);
  const autosave = createAutosave(store, save, () => {});
  store.getState().rename('Unsaved');
  expect(await autosave.flush()).toBe(false);
  expect(autosave.getStatus().status).toBe('error');
  expect(await autosave.flush()).toBe(true);
  expect(autosave.getStatus().status).toBe('saved');
  store.getState().rename('Final');
  autosave.dispose();
  await autosave.flush();
  expect(save.mock.calls.at(-1)?.[0].name).toBe('Final');
});
