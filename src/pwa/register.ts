import { create } from 'zustand';
import type { WorkerMessage } from './constants';

/** Chromium's install prompt (not yet in TypeScript's DOM types). */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type OfflineStatus =
  /** Development server: the service worker is only part of the built app. */
  | 'development'
  /** The browser has no service workers. */
  | 'unsupported'
  /** Blocked, e.g. in some private windows. */
  | 'failed'
  | 'preparing'
  | 'ready';

interface PwaState {
  status: OfflineStatus;
  /** A new version is saved and waits to take over. */
  update: ServiceWorker | null;
  /** Kept until the person chooses Install (Chromium browsers only). */
  installPrompt: BeforeInstallPromptEvent | null;
  /** Running as an installed app. */
  installed: boolean;
}

export const usePwa = create<PwaState>(() => ({
  status: 'preparing',
  update: null,
  installPrompt: null,
  installed: false,
}));

function sync(registration: ServiceWorkerRegistration) {
  usePwa.setState({
    status: registration.active ? 'ready' : 'preparing',
    // The first version has nothing to replace, so only later versions wait.
    update: navigator.serviceWorker.controller ? registration.waiting : null,
  });
}

/** Switches to the waiting version; every open tab of the app then reloads. */
export function applyUpdate(): void {
  const message: WorkerMessage = { type: 'SKIP_WAITING' };
  usePwa.getState().update?.postMessage(message);
}

/** Shows the browser's install dialog. Returns whether the app was installed. */
export async function promptInstall(): Promise<boolean> {
  const prompt = usePwa.getState().installPrompt;
  if (!prompt) return false;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  // A prompt can be shown only once.
  usePwa.setState({ installPrompt: null });
  return outcome === 'accepted';
}

/** True on iPhone and iPad, where apps are installed from the Share menu. */
export function isAppleMobile(): boolean {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Registers the service worker that keeps the app working offline, and follows installs
 * and updates. Called once at startup.
 */
export function startOfflineSupport(): void {
  const standalone = window.matchMedia('(display-mode: standalone)');
  const updateInstalled = () =>
    usePwa.setState({
      installed: standalone.matches || (navigator as { standalone?: boolean }).standalone === true,
    });
  updateInstalled();
  standalone.addEventListener('change', updateInstalled);
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    usePwa.setState({ installPrompt: event as BeforeInstallPromptEvent });
  });
  window.addEventListener('appinstalled', () =>
    usePwa.setState({ installPrompt: null, installed: true }),
  );

  if (!import.meta.env.PROD) {
    usePwa.setState({ status: 'development' });
    return;
  }
  if (!('serviceWorker' in navigator)) {
    usePwa.setState({ status: 'unsupported' });
    return;
  }
  let controlled = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The first install takes control without a reload; a new version replacing the
    // current one needs a reload, so the page runs the code it was saved with.
    if (!controlled) {
      controlled = true;
      return;
    }
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  const register = async () => {
    try {
      const base = import.meta.env.BASE_URL;
      const registration = await navigator.serviceWorker.register(`${base}sw.js`, {
        scope: base,
        updateViaCache: 'none',
      });
      const follow = (worker: ServiceWorker | null) =>
        worker?.addEventListener('statechange', () => sync(registration));
      follow(registration.installing);
      follow(registration.waiting);
      registration.addEventListener('updatefound', () => {
        follow(registration.installing);
        sync(registration);
      });
      sync(registration);
      // Long editing sessions still learn about new versions.
      window.setInterval(() => void registration.update().catch(() => undefined), 3_600_000);
    } catch (error) {
      console.warn('Offline use is not available', error);
      usePwa.setState({ status: 'failed' });
    }
  };
  // Register after the first screen has loaded, so saving files never slows it down.
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', () => void register(), { once: true });
}
