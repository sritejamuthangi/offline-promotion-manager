import { z } from 'zod';
import { duplicateDesign } from './design/factory';
import { newId } from './ids';
import { type Design, MAX_NAME_LENGTH } from './schema';
import { TEMPLATE_CATEGORIES, type TemplateCategory } from './templates';

/**
 * Backups and design files: ZIP files with a `backup.json` table of contents and the
 * original image files. A design file is the same format with one design and its images.
 * People can open them with any ZIP tool; nothing in them is specific to one device.
 */
export const BACKUP_FORMAT = 'offline-promotion-manager';
export const BACKUP_VERSION = 1;
export const BACKUP_MANIFEST = 'backup.json';

export type BackupKind = 'backup' | 'design';

/** Where an image came from, kept so licences and credits travel with it. */
const AssetSourceSchema = z.object({
  kind: z.enum(['upload', 'builtin', 'openverse', 'wikimedia']),
  url: z.string().max(4000).optional(),
  license: z.string().max(500).optional(),
  licenseUrl: z.string().max(4000).optional(),
  attribution: z.string().max(4000).optional(),
  title: z.string().max(1000).optional(),
  creator: z.string().max(1000).optional(),
  creatorUrl: z.string().max(4000).optional(),
});

export const BackupAssetSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(1000),
  /** Only images, like uploads. */
  type: z.string().regex(/^image\/[\w.+-]+$/i),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  createdAt: z.number().int().nonnegative(),
  // A source this version doesn't know is kept as a plain upload.
  source: AssetSourceSchema.catch({ kind: 'upload' }),
  /** Path of the image file inside the ZIP file. */
  file: z
    .string()
    .min(1)
    .max(300)
    .refine((path) => path.startsWith('images/') && !path.includes('..'), 'Invalid image path.'),
});
export type BackupAsset = z.infer<typeof BackupAssetSchema>;

export const BackupTemplateSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(MAX_NAME_LENGTH),
  category: z.enum(TEMPLATE_CATEGORIES).optional(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  /** Checked with `migrateDesign`, like designs. */
  design: z.unknown(),
});

/** The table of contents. Items are checked one by one, so one bad item can be skipped. */
export const BackupManifestSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number().int().positive(),
  kind: z.enum(['backup', 'design']),
  createdAt: z.number().int().nonnegative(),
  app: z.string().max(200).optional(),
  // A ZIP file can't hold more entries than this, and the cap keeps a hostile file from
  // asking the app to build an enormous list.
  designs: z.array(z.unknown()).max(50_000),
  templates: z.array(z.unknown()).max(50_000),
  assets: z.array(z.unknown()).max(50_000),
});
export type BackupManifest = z.infer<typeof BackupManifestSchema>;

/** A saved template as stored on the device and in backups. */
export interface TemplateData {
  id: string;
  name: string;
  category?: TemplateCategory;
  createdAt: number;
  updatedAt: number;
  design: Design;
}

const ASSET_PREFIX = 'asset:';
/** Properties that hold image references: images, image fills and Smart Grid logos. */
const IMAGE_KEYS = new Set(['src', 'logoSrc']);

/** IDs of the stored images a design (or any part of one) uses. */
export function assetReferences(value: unknown, into: Set<string> = new Set()): Set<string> {
  const walk = (node: unknown, key?: string) => {
    if (typeof node === 'string') {
      if (key && IMAGE_KEYS.has(key) && node.startsWith(ASSET_PREFIX))
        into.add(node.slice(ASSET_PREFIX.length));
    } else if (Array.isArray(node)) {
      for (const item of node) walk(item);
    } else if (node && typeof node === 'object') {
      for (const [name, item] of Object.entries(node)) walk(item, name);
    }
  };
  walk(value);
  return into;
}

/** A copy with image references changed from old to new IDs. */
export function remapAssets<T>(value: T, ids: ReadonlyMap<string, string>): T {
  if (!ids.size) return value;
  const walk = (node: unknown, key?: string): unknown => {
    if (typeof node === 'string') {
      if (!key || !IMAGE_KEYS.has(key) || !node.startsWith(ASSET_PREFIX)) return node;
      const next = ids.get(node.slice(ASSET_PREFIX.length));
      return next ? `${ASSET_PREFIX}${next}` : node;
    }
    if (Array.isArray(node)) return node.map((item) => walk(item));
    if (node && typeof node === 'object')
      return Object.fromEntries(
        Object.entries(node).map(([name, item]) => [name, walk(item, name)]),
      );
    return node;
  };
  return walk(value) as T;
}

const EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
};

/** Where an image is kept inside a backup. */
export function backupImagePath(id: string, type: string): string {
  return `images/${id.replace(/[^\w-]/g, '_')}.${EXTENSIONS[type.toLowerCase()] ?? 'img'}`;
}

/** What is already on this device, to merge a backup into. */
export interface Inventory {
  designs: ReadonlyMap<string, { updatedAt: number; deleted: boolean }>;
  /** Saved template ID → last change. */
  templates: ReadonlyMap<string, number>;
  /** Image ID → content hash. */
  assets: ReadonlyMap<string, string>;
}

export interface RestoreSummary {
  /** Added as they were in the file, or brought back from Recently deleted. */
  designs: number;
  templates: number;
  images: number;
  /** Items identical to ones already on this device. */
  existing: number;
  /** Items that differ from this device's version, added as copies. */
  copies: number;
}

export interface RestorePlan<A extends { id: string; hash: string }> {
  assets: A[];
  designs: Design[];
  templates: TemplateData[];
  /** Designs in Recently deleted that the file contains unchanged. */
  undelete: string[];
  summary: RestoreSummary;
}

/**
 * Merges a backup into what is on this device without replacing or deleting anything:
 * new items are added unchanged (keeping their IDs, so restoring on a new device gives the
 * same library), identical items are skipped, and items that differ from this device's
 * version are added as copies. Images are matched by content, so each is stored once.
 */
export function planRestore<A extends { id: string; hash: string }>(
  incoming: {
    designs: readonly Design[];
    templates: readonly TemplateData[];
    assets: readonly A[];
  },
  inventory: Inventory,
  options: { copyName: (name: string) => string; now: number },
): RestorePlan<A> {
  const summary: RestoreSummary = { designs: 0, templates: 0, images: 0, existing: 0, copies: 0 };
  const byHash = new Map<string, string>();
  for (const [id, hash] of inventory.assets) byHash.set(hash, id);
  const remap = new Map<string, string>();
  const assets: A[] = [];
  const takenAssets = new Set<string>();
  for (const asset of incoming.assets) {
    const local = inventory.assets.get(asset.id);
    if (local === asset.hash && !takenAssets.has(asset.id)) {
      takenAssets.add(asset.id);
      summary.existing++;
      continue;
    }
    const same = byHash.get(asset.hash);
    if (same) {
      // The same picture under another ID: use the one already here.
      remap.set(asset.id, same);
      summary.existing++;
      continue;
    }
    const id = local === undefined && !takenAssets.has(asset.id) ? asset.id : newId();
    takenAssets.add(id);
    if (id !== asset.id) remap.set(asset.id, id);
    byHash.set(asset.hash, id);
    assets.push({ ...asset, id });
    summary.images++;
  }

  const designs: Design[] = [];
  const undelete: string[] = [];
  const takenDesigns = new Set<string>();
  for (const source of incoming.designs) {
    const design = remapAssets(structuredClone(source), remap);
    delete design.deletedAt;
    const local = inventory.designs.get(design.id);
    if (!local && !takenDesigns.has(design.id)) {
      designs.push(design);
      takenDesigns.add(design.id);
      summary.designs++;
    } else if (local && local.updatedAt === design.updatedAt && !takenDesigns.has(design.id)) {
      takenDesigns.add(design.id);
      if (local.deleted) {
        undelete.push(design.id);
        summary.designs++;
      } else summary.existing++;
    } else {
      designs.push(
        duplicateDesign(design, { name: options.copyName(design.name), now: options.now }),
      );
      summary.copies++;
    }
  }

  const templates: TemplateData[] = [];
  const takenTemplates = new Set<string>();
  for (const source of incoming.templates) {
    const template = remapAssets(structuredClone(source), remap);
    const local = inventory.templates.get(template.id);
    if (local === undefined && !takenTemplates.has(template.id)) {
      templates.push(template);
      takenTemplates.add(template.id);
      summary.templates++;
    } else if (local === template.updatedAt && !takenTemplates.has(template.id)) {
      takenTemplates.add(template.id);
      summary.existing++;
    } else {
      const name = options.copyName(template.name).slice(0, MAX_NAME_LENGTH);
      templates.push({
        ...template,
        id: newId(),
        name,
        design: { ...template.design, name },
        createdAt: options.now,
        updatedAt: options.now,
      });
      summary.copies++;
    }
  }
  return { assets, designs, templates, undelete, summary };
}
