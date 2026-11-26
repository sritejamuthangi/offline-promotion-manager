import { cleanDesignName } from '@/core/design/factory';
import { newId } from '@/core/ids';
import { type Design, DesignSchema } from '@/core/schema';
import type { TemplateCategory } from '@/core/templates';
import type { AppDatabase, SavedTemplate } from './db';

/** Templates people save from their own designs, kept on this device only. */
export interface TemplateRepository {
  /** Most recently changed first. */
  list(): Promise<SavedTemplate[]>;
  get(id: string): Promise<SavedTemplate | undefined>;
  /** Stores a copy of the design; later edits to the design do not change the template. */
  create(input: {
    name: string;
    category?: TemplateCategory;
    design: Design;
  }): Promise<SavedTemplate>;
  rename(id: string, name: string): Promise<void>;
  remove(id: string): Promise<void>;
}

export class TemplateNotFoundError extends Error {
  constructor(readonly templateId: string) {
    super(`Template not found: ${templateId}`);
    this.name = 'TemplateNotFoundError';
  }
}

export function createDexieTemplateRepository(
  db: AppDatabase,
  clock: () => number = Date.now,
): TemplateRepository {
  return {
    list: () => db.templates.orderBy('updatedAt').reverse().toArray(),
    get: (id) => db.templates.get(id),
    async create({ name, category, design }) {
      const now = clock();
      const clean = cleanDesignName(name, design.name);
      const copy = DesignSchema.parse(structuredClone(design));
      delete copy.deletedAt;
      copy.name = clean;
      const record: SavedTemplate = {
        id: newId(),
        name: clean,
        design: copy,
        createdAt: now,
        updatedAt: now,
        ...(category ? { category } : {}),
      };
      await db.templates.add(record);
      return record;
    },
    async rename(id, name) {
      if (!name.trim()) throw new RangeError('A template name cannot be empty.');
      await db.transaction('rw', db.templates, async () => {
        const existing = await db.templates.get(id);
        if (!existing) throw new TemplateNotFoundError(id);
        const clean = cleanDesignName(name, existing.name);
        await db.templates.put({
          ...existing,
          name: clean,
          design: { ...existing.design, name: clean },
          updatedAt: Math.max(clock(), existing.updatedAt + 1),
        });
      });
    },
    async remove(id) {
      await db.templates.delete(id);
    },
  };
}
