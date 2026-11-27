import type { z } from 'zod';
import {
  BACKUP_FORMAT,
  BACKUP_MANIFEST,
  BACKUP_VERSION,
  BackupAssetSchema,
  type BackupKind,
  BackupManifestSchema,
  BackupTemplateSchema,
  backupImagePath,
  type TemplateData,
} from './backup';
import { hashBlob } from './hash';
import { type Design, migrateDesign } from './schema';
import {
  createZip,
  readZipDirectory,
  readZipEntry,
  type ZipEntry,
  ZipError,
  type ZipInput,
} from './zip';

/** A picture larger than this is refused rather than risking the device's memory. */
export const MAX_BACKUP_IMAGE_BYTES = 100 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 100 * 1024 * 1024;

export type BackupErrorCode = 'notBackup' | 'newerVersion' | 'damaged';

export class BackupError extends Error {
  readonly code: BackupErrorCode;

  constructor(code: BackupErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'BackupError';
    this.code = code;
  }
}

/** An image to write into a backup. */
export interface BackupAssetInput {
  id: string;
  name: string;
  type: string;
  width?: number;
  height?: number;
  createdAt: number;
  source: z.infer<typeof BackupAssetSchema>['source'];
  blob: Blob;
}

export interface BackupContents {
  /** Every design, including those in Recently deleted. */
  designs: readonly Design[];
  templates: readonly TemplateData[];
  assets: readonly BackupAssetInput[];
}

const encoder = new TextEncoder();

function readme(kind: BackupKind, app: string | undefined): string {
  const owner = app ? ` by ${app}` : '';
  return [
    kind === 'design'
      ? `A design${owner}, saved as an open ZIP file.`
      : `A backup${owner}, saved as an open ZIP file.`,
    '',
    `The table of contents is ${BACKUP_MANIFEST}, and every picture is in images/.`,
    'Keep this file to move your work to another device or browser.',
    'Open it with this app: Settings → Backup and restore.',
    '',
    'The file contains no passwords or account details, and nothing was uploaded anywhere.',
    '',
  ].join('\n');
}

/** Builds a backup ZIP file, or a design file with one design and its pictures. */
export async function createBackupZip(
  contents: BackupContents,
  options: { kind: BackupKind; now?: number; app?: string },
): Promise<Blob> {
  const now = options.now ?? Date.now();
  const assets = contents.assets.map((asset) => ({
    id: asset.id,
    name: asset.name,
    type: asset.type,
    ...(asset.width ? { width: asset.width } : {}),
    ...(asset.height ? { height: asset.height } : {}),
    createdAt: asset.createdAt,
    source: asset.source,
    file: backupImagePath(asset.id, asset.type),
  }));
  const manifest = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    kind: options.kind,
    createdAt: now,
    ...(options.app ? { app: options.app } : {}),
    designs: contents.designs,
    templates: contents.templates,
    assets,
  };
  const inputs: ZipInput[] = [
    {
      name: BACKUP_MANIFEST,
      data: encoder.encode(JSON.stringify(manifest, null, 2)),
      compress: true,
    },
    { name: 'README.txt', data: encoder.encode(readme(options.kind, options.app)), compress: true },
  ];
  for (const asset of contents.assets)
    inputs.push({ name: backupImagePath(asset.id, asset.type), data: asset.blob });
  return createZip(inputs, new Date(now));
}

/** Something in the file that could not be read; the rest of the file is still usable. */
export interface BackupIssue {
  name: string;
  reason: string;
}

/** A picture whose bytes were read and checked against the file. */
export type IncomingAsset = z.infer<typeof BackupAssetSchema> & { hash: string };

export interface BackupFile {
  manifest: z.infer<typeof BackupManifestSchema>;
  designs: Design[];
  templates: TemplateData[];
  assets: IncomingAsset[];
  issues: BackupIssue[];
  /** Reads a picture again, checking its size and CRC-32, for restoring. */
  readAsset(asset: IncomingAsset): Promise<Blob>;
}

const reason = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Opens a backup or design file: checks the table of contents, then each design, template
 * and picture. Damaged items are listed in `issues` instead of failing the whole file.
 */
export async function readBackupZip(
  file: Blob,
  onProgress: (done: number, total: number) => void = () => undefined,
): Promise<BackupFile> {
  let entries: ZipEntry[];
  try {
    entries = await readZipDirectory(file);
  } catch (error) {
    throw new BackupError(
      error instanceof ZipError && error.code === 'notZip' ? 'notBackup' : 'damaged',
      'This is not a backup or design file.',
      { cause: error },
    );
  }
  const byName = new Map(entries.map((entry) => [entry.name, entry]));
  const manifestEntry = byName.get(BACKUP_MANIFEST);
  if (!manifestEntry) throw new BackupError('notBackup', 'This ZIP file has no backup.json.');

  let raw: unknown;
  try {
    const blob = await readZipEntry(file, manifestEntry, {
      maxSize: MAX_MANIFEST_BYTES,
      type: 'application/json',
    });
    raw = JSON.parse(await blob.text());
  } catch (error) {
    throw new BackupError('damaged', 'The backup.json in this file cannot be read.', {
      cause: error,
    });
  }
  if (typeof raw === 'object' && raw !== null) {
    const version = (raw as { version?: unknown }).version;
    if (typeof version === 'number' && version > BACKUP_VERSION)
      throw new BackupError(
        'newerVersion',
        'This file was made by a newer version of the app. Update the app, then try again.',
      );
  }
  const parsed = BackupManifestSchema.safeParse(raw);
  if (!parsed.success) {
    const format = (raw as { format?: unknown } | null)?.format;
    throw new BackupError(
      format === BACKUP_FORMAT ? 'damaged' : 'notBackup',
      'This is not an Offline Promotion Manager backup.',
      { cause: parsed.error },
    );
  }
  const manifest = parsed.data;
  const issues: BackupIssue[] = [];

  const designs: Design[] = [];
  manifest.designs.forEach((item, index) => {
    try {
      designs.push(migrateDesign(item));
    } catch (error) {
      issues.push({ name: `design ${index + 1}`, reason: reason(error) });
    }
  });

  const templates: TemplateData[] = [];
  manifest.templates.forEach((item, index) => {
    try {
      const template = BackupTemplateSchema.parse(item);
      templates.push({ ...template, design: migrateDesign(template.design) });
    } catch (error) {
      issues.push({ name: `template ${index + 1}`, reason: reason(error) });
    }
  });

  const assets: IncomingAsset[] = [];
  let done = 0;
  onProgress(0, manifest.assets.length);
  for (const [index, item] of manifest.assets.entries()) {
    const name = `picture ${index + 1}`;
    try {
      const asset = BackupAssetSchema.parse(item);
      const entry = byName.get(asset.file);
      if (!entry) throw new Error('Its picture file is missing from the ZIP file.');
      const blob = await readZipEntry(file, entry, {
        maxSize: MAX_BACKUP_IMAGE_BYTES,
        type: asset.type,
      });
      assets.push({ ...asset, hash: await hashBlob(blob) });
    } catch (error) {
      issues.push({ name, reason: reason(error) });
    }
    onProgress(++done, manifest.assets.length);
  }

  return {
    manifest,
    designs,
    templates,
    assets,
    issues,
    async readAsset(asset) {
      const entry = byName.get(asset.file);
      if (!entry) throw new Error('Its picture file is missing from the ZIP file.');
      return readZipEntry(file, entry, {
        maxSize: MAX_BACKUP_IMAGE_BYTES,
        type: asset.type,
      });
    },
  };
}
