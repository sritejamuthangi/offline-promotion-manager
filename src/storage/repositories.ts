import type { Design } from '@/core/schema';

/**
 * Everything the app needs from design storage. The UI depends only on this interface,
 * so a cloud or self-hosted database can be added later as another implementation
 * without changing the editor.
 */
export interface DesignRepository {
  /** Designs not in "Recently deleted", most recently edited first. */
  list(): Promise<Design[]>;
  /** Designs in "Recently deleted", most recently deleted first. */
  listDeleted(): Promise<Design[]>;
  get(id: string): Promise<Design | undefined>;
  /** Validates and stores a design, replacing any previous version. */
  save(design: Design): Promise<void>;
  /** Atomically saves edits only if the stored design has not changed in another editor. */
  saveEdited(design: Design, expectedUpdatedAt: number): Promise<void>;
  rename(id: string, name: string): Promise<void>;
  duplicate(id: string, name: string): Promise<Design>;
  /** Moves a design to "Recently deleted". */
  remove(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  /** Deletes a design permanently. */
  destroy(id: string): Promise<void>;
  /** Permanently deletes designs moved to "Recently deleted" before `before`. */
  purgeDeleted(before: number): Promise<number>;
}

export class DesignNotFoundError extends Error {
  constructor(readonly designId: string) {
    super(`Design not found: ${designId}`);
    this.name = 'DesignNotFoundError';
  }
}

export class DesignConflictError extends Error {
  constructor() {
    super('This design changed in another tab.');
    this.name = 'DesignConflictError';
  }
}
