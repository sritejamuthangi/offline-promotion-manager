export interface StorageStatus {
  /** Whether the browser supports the Storage API at all. */
  supported: boolean;
  /** True when the browser promised not to clear this site's data automatically. */
  persisted: boolean;
  usage?: number;
  quota?: number;
}

function storageManager(): StorageManager | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator.storage;
}

export async function getStorageStatus(): Promise<StorageStatus> {
  const storage = storageManager();
  if (!storage?.estimate) return { supported: false, persisted: false };
  const [estimate, persisted] = await Promise.all([
    storage.estimate().catch(() => undefined),
    storage.persisted?.().catch(() => false) ?? Promise.resolve(false),
  ]);
  return { supported: true, persisted, usage: estimate?.usage, quota: estimate?.quota };
}

/**
 * Asks the browser to keep this site's data even when the device runs low on space.
 * Chromium decides automatically (installed apps are usually granted); Firefox may ask.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  const storage = storageManager();
  if (!storage?.persist) return false;
  try {
    if (await storage.persisted()) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}
