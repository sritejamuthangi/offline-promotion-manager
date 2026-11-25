import { type Design, DesignSchema, SCHEMA_VERSION } from './design';

type RawDesign = Record<string, unknown>;
type Migration = (design: RawDesign) => RawDesign;

/**
 * `MIGRATIONS[n]` upgrades a design from schema version `n + 1` to `n + 2`.
 *
 * When the file format changes:
 *   1. bump SCHEMA_VERSION in design.ts,
 *   2. append a migration here that converts the previous version,
 *   3. add a test with a design saved in the previous format.
 */
const MIGRATIONS: readonly Migration[] = [];

export type DesignFormatErrorCode = 'invalid' | 'unsupportedVersion' | 'newerVersion';

export class DesignFormatError extends Error {
  readonly code: DesignFormatErrorCode;

  constructor(code: DesignFormatErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DesignFormatError';
    this.code = code;
  }
}

function isRecord(value: unknown): value is RawDesign {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates a design from storage or an imported file and upgrades it to the current
 * schema version. Throws `DesignFormatError` when it cannot be read.
 */
export function migrateDesign(input: unknown): Design {
  if (!isRecord(input)) {
    throw new DesignFormatError('invalid', 'A design must be a JSON object.');
  }
  const version = input.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new DesignFormatError('unsupportedVersion', 'The design has no valid schema version.');
  }
  if (version > SCHEMA_VERSION) {
    throw new DesignFormatError(
      'newerVersion',
      `The design was made with a newer version of the app (format ${version}).`,
    );
  }

  let doc: RawDesign = input;
  for (let v = version; v < SCHEMA_VERSION; v++) {
    const migrate = MIGRATIONS[v - 1];
    if (!migrate) {
      throw new DesignFormatError('unsupportedVersion', `No migration from format ${v}.`);
    }
    doc = { ...migrate(doc), schemaVersion: v + 1 };
  }

  const result = DesignSchema.safeParse(doc);
  if (!result.success) {
    throw new DesignFormatError('invalid', 'The design file is damaged or incomplete.', {
      cause: result.error,
    });
  }
  return result.data;
}
