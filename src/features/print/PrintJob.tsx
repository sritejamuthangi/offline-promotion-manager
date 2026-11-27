import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { PrintPlan } from '@/core/print';
import type { Design } from '@/core/schema';
import { cssMm, PrintSheetView } from './PrintSheetView';

export interface PrintJobData {
  /** Original design; the sheet renderer adds bleed. */
  design: Design;
  plan: PrintPlan;
  /** Optional label per sheet, e.g. a poster tile's position. */
  labels: readonly (string | undefined)[];
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** Waits until every picture and font on the sheets is ready, so nothing prints blank. */
async function artworkReady(root: HTMLElement | null): Promise<void> {
  await nextFrame();
  if (!root) return;
  // Laying the sheets out starts loading the fonts they use, so `fonts.ready` waits for them.
  root.getBoundingClientRect();
  const pending: Promise<unknown>[] = [document.fonts.ready];
  for (const image of root.querySelectorAll('img')) pending.push(image.decode());
  const backgrounds = new Set<string>();
  for (const node of root.querySelectorAll<HTMLElement>('[style*="url("]'))
    for (const match of node.style.backgroundImage.matchAll(/url\("([^"]+)"\)/g))
      if (match[1]) backgrounds.add(match[1]);
  for (const url of backgrounds) {
    const image = new Image();
    image.src = url;
    pending.push(image.decode());
  }
  let timer: number | undefined;
  try {
    await Promise.race([
      Promise.all(pending),
      new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error('Artwork loading timed out.')), 30_000);
      }),
    ]);
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Prints a job through the browser: renders the sheets outside the app, sizes the paper
 * with `@page` and opens the print dialog. Printing with the browser keeps text and shapes
 * as sharp vectors, at true size.
 *
 * The sheets stay ready until the job is replaced or removed, not just until `afterprint`:
 * some phone browsers return from `window.print()` straight away and lay out the printout
 * later, which would otherwise print the editor or a blank page.
 */
export function PrintJob({
  job,
  onPrinted,
  onError,
}: {
  job: PrintJobData | null;
  /** The browser's print window has closed, whether the job printed or was cancelled. */
  onPrinted: () => void;
  /** The artwork could not be prepared, or printing could not start. */
  onError: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onPrintedRef = useRef(onPrinted);
  onPrintedRef.current = onPrinted;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!job) return;
    let waiting = true;
    const html = document.documentElement;
    const previousTitle = document.title;
    const media = window.matchMedia('print');
    const stopListening = () => {
      window.removeEventListener('afterprint', printed);
      media.removeEventListener('change', mediaChanged);
    };
    function printed() {
      if (!waiting) return;
      waiting = false;
      stopListening();
      onPrintedRef.current();
    }
    function mediaChanged(event: MediaQueryListEvent) {
      if (!event.matches) printed();
    }
    html.classList.add('opm-printing');
    void artworkReady(rootRef.current)
      .then(() => {
        if (!waiting) return;
        // Browsers suggest the page title as the file name for "Save as PDF".
        document.title = job.design.name;
        window.addEventListener('afterprint', printed);
        media.addEventListener('change', mediaChanged);
        window.print();
      })
      .catch((error: unknown) => {
        if (!waiting) return;
        waiting = false;
        stopListening();
        console.error('Printing failed', error);
        onErrorRef.current();
      });
    return () => {
      waiting = false;
      stopListening();
      html.classList.remove('opm-printing');
      document.title = previousTitle;
    };
  }, [job]);

  if (!job) return null;
  const { width, height } = job.plan.sheet;
  return createPortal(
    <div
      ref={rootRef}
      className="opm-print-root"
      data-testid="print-root"
      data-sheets={job.plan.sheets.length}
    >
      <style>{`@page { size: ${cssMm(width)} ${cssMm(height)}; margin: 0; }`}</style>
      {job.plan.sheets.map((sheet, index) => (
        <PrintSheetView
          // biome-ignore lint/suspicious/noArrayIndexKey: Sheets are positional and never reorder.
          key={index}
          design={job.design}
          plan={job.plan}
          sheet={sheet}
          label={job.labels[index]}
        />
      ))}
    </div>,
    document.body,
  );
}
