import { cleanDesignName, duplicateDesign } from '@/core/design/factory';
import { type Design, DesignSchema } from '@/core/schema';
import type { AppDatabase } from './db';
import { DesignConflictError, DesignNotFoundError, type DesignRepository } from './repositories';

const isDeleted = (design: Design) => design.deletedAt !== undefined;

/** Stores designs in the browser's IndexedDB, on this device only. */
export function createDexieDesignRepository(
  db: AppDatabase,
  clock: () => number = Date.now,
): DesignRepository {
  async function requireUpdate(id: string, changes: Partial<Design>): Promise<void> {
    const updated = await db.designs.update(id, changes);
    if (updated === 0) throw new DesignNotFoundError(id);
  }

  return {
    async list() {
      const all = await db.designs.orderBy('updatedAt').reverse().toArray();
      return all.filter((design) => !isDeleted(design));
    },

    async listDeleted() {
      const all = await db.designs.toArray();
      return all.filter(isDeleted).sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
    },

    get(id) {
      return db.designs.get(id);
    },

    async save(design) {
      await db.designs.put(DesignSchema.parse(design));
    },

    async saveEdited(design, expectedUpdatedAt) {
      const validated = DesignSchema.parse(design);
      await db.transaction('rw', db.designs, async () => {
        const existing = await db.designs.get(design.id);
        if (!existing || existing.deletedAt !== undefined) throw new DesignNotFoundError(design.id);
        if (existing.updatedAt !== expectedUpdatedAt) throw new DesignConflictError();
        await db.designs.put(validated);
      });
    },

    async rename(id, name) {
      if (!name.trim()) throw new RangeError('A design name cannot be empty.');
      await db.transaction('rw', db.designs, async () => {
        const existing = await db.designs.get(id);
        if (!existing) throw new DesignNotFoundError(id);
        await requireUpdate(id, {
          name: cleanDesignName(name),
          updatedAt: Math.max(clock(), existing.updatedAt + 1),
        });
      });
    },

    async duplicate(id, name) {
      const source = await db.designs.get(id);
      if (!source) throw new DesignNotFoundError(id);
      const copy = duplicateDesign(source, { name, now: clock() });
      await db.designs.add(copy);
      return copy;
    },

    async remove(id) {
      await requireUpdate(id, { deletedAt: clock() });
    },

    async restore(id) {
      // Dexie removes a property when it is updated to `undefined`.
      await requireUpdate(id, { deletedAt: undefined });
    },

    async destroy(id) {
      await db.designs.delete(id);
    },

    async purgeDeleted(before) {
      const all = await db.designs.toArray();
      const expired = all
        .filter((design) => design.deletedAt !== undefined && design.deletedAt < before)
        .map((design) => design.id);
      await db.designs.bulkDelete(expired);
      return expired.length;
    },
  };
}
