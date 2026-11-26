import { type RefObject, useEffect, useState, useSyncExternalStore } from 'react';

/** Tracks a CSS media query, e.g. `(prefers-color-scheme: dark)`. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Current time, refreshed every `intervalMs`, for "edited 5 minutes ago" labels. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** Measures the available viewport, including changes caused by responsive side panels. */
export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect)
        setSize((old) =>
          old.width === rect.width && old.height === rect.height
            ? old
            : { width: rect.width, height: rect.height },
        );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
