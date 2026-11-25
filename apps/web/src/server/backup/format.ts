import { z } from "zod";

import {
  BACKUP_FORMAT,
  BACKUP_VERSION_V1,
  type BackupEnvelopeV1,
  type BackupJsonValue,
  type BackupPreviewCounts,
  type BackupPreviewData,
  type BackupSource,
  type BackupValidationIssue,
} from "./types";

const includedScope = ["configs", "albums", "images", "imageAlbumRelations"] as const;
const excludedScope = [
  "user",
  "session",
  "account",
  "two_factor",
  "passkey",
  "verification",
  "admin_task_runs",
  "daily_images",
] as const;

const emptyCounts: BackupPreviewCounts = {
  configs: 0,
  albums: 0,
  images: 0,
  imageAlbumRelations: 0,
};

const isoDateStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Expected a valid ISO datetime string",
});

const backupJsonSchema: z.ZodType<BackupJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(backupJsonSchema),
    z.record(z.string(), backupJsonSchema),
  ]),
);

const backupSourceSchema: z.ZodType<BackupSource> = z
  .object({
    orm: z.enum(["prisma", "drizzle", "unknown"]),
    database: z.literal("postgresql"),
  })
  .strict();

const backupConfigRecordSchema = z
  .object({
    config_key: z.string().min(1),
    config_value: z.string().nullable(),
    detail: z.string().nullable(),
    createdAt: isoDateStringSchema,
    updatedAt: isoDateStringSchema.nullable(),
  })
  .strict();

const backupAlbumRecordSchema = z
  .object({
    album_value: z.string().min(1),
    name: z.string().min(1),
    detail: z.string().nullable(),
    theme: z.string(),
    show: z.number().int(),
    sort: z.number().int(),
    random_show: z.number().int(),
    license: z.string().nullable(),
    image_sorting: z.number().int(),
    daily_weight: z.number().int(),
    del: z.number().int(),
    createdAt: isoDateStringSchema,
    updatedAt: isoDateStringSchema.nullable(),
  })
  .strict();

const backupImageRecordSchema = z
  .object({
    id: z.string().min(1),
    image_name: z.string().nullable(),
    url: z.string().nullable(),
    preview_url: z.string().nullable(),
    video_url: z.string().nullable(),
    blurhash: z.string().nullable(),
    exif: backupJsonSchema.nullable(),
    labels: backupJsonSchema.nullable(),
    width: z.number().int().nonnegative(),
    height: z.number().int().nonnegative(),
    lon: z.string().nullable(),
    lat: z.string().nullable(),
    title: z.string().nullable(),
    detail: z.string().nullable(),
    type: z.number().int(),
    show: z.number().int(),
    show_on_mainpage: z.number().int(),
    sort: z.number().int(),
    del: z.number().int(),
    createdAt: isoDateStringSchema,
    updatedAt: isoDateStringSchema.nullable(),
  })
  .strict();

const backupImageAlbumRelationRecordSchema = z
  .object({
    imageId: z.string().min(1),
    album_value: z.string().min(1),
  })
  .strict();

const backupEnvelopeV1Schema: z.ZodType<BackupEnvelopeV1> = z
  .object({
    format: z.literal(BACKUP_FORMAT),
    version: z.literal(BACKUP_VERSION_V1),
    exportedAt: isoDateStringSchema,
    source: backupSourceSchema,
    payload: z
      .object({
        configs: z.array(backupConfigRecordSchema),
        albums: z.array(backupAlbumRecordSchema),
        images: z.array(backupImageRecordSchema),
        imageAlbumRelations: z.array(backupImageAlbumRelationRecordSchema),
      })
      .strict(),
  })
  .strict();

function createPreviewData(partial?: Partial<BackupPreviewData>): BackupPreviewData {
  return {
    valid: false,
    format: null,
    version: null,
    exportedAt: null,
    source: null,
    scope: {
      included: [...includedScope],
      excluded: [...excludedScope],
    },
    counts: emptyCounts,
    warnings: [],
    issues: [],
    ...partial,
  };
}

function pathToString(path: readonly PropertyKey[]): string {
  return path.length === 0
    ? "$"
    : path.reduce<string>((result, segment) => {
        if (typeof segment === "number") {
          return `${result}[${segment}]`;
        }
        return `${result}.${String(segment)}`;
      }, "$");
}

function zodIssuesToValidationIssues(error: z.ZodError): BackupValidationIssue[] {
  return error.issues.map((issue) => ({
    path: pathToString(issue.path),
    message: issue.message,
  }));
}

export class BackupValidationError extends Error {
  constructor(
    message: string,
    readonly preview: BackupPreviewData,
  ) {
    super(message);
    this.name = "BackupValidationError";
  }
}

function appendDuplicateIssues<T>(
  issues: BackupValidationIssue[],
  items: T[],
  getKey: (value: T) => string,
  getPath: (position: number) => string,
  label: string,
) {
  const seen = new Map<string, number>();
  items.forEach((item, index) => {
    const key = getKey(item);
    const previousIndex = seen.get(key);
    if (previousIndex !== undefined) {
      issues.push({
        path: getPath(index),
        message: `Duplicate ${label}: "${key}" also appears at index ${previousIndex}`,
      });
      return;
    }
    seen.set(key, index);
  });
}

function getPreviewCounts(envelope: BackupEnvelopeV1): BackupPreviewCounts {
  return {
    configs: envelope.payload.configs.length,
    albums: envelope.payload.albums.length,
    images: envelope.payload.images.length,
    imageAlbumRelations: envelope.payload.imageAlbumRelations.length,
  };
}

function appendRelationReferenceIssues(
  envelope: BackupEnvelopeV1,
  issues: BackupValidationIssue[],
) {
  const imageIds = new Set(envelope.payload.images.map((item) => item.id));
  const albumValues = new Set(envelope.payload.albums.map((item) => item.album_value));
  envelope.payload.imageAlbumRelations.forEach((relation, index) => {
    if (!imageIds.has(relation.imageId)) {
      issues.push({
        path: `$.payload.imageAlbumRelations[${index}].imageId`,
        message: `Referenced image "${relation.imageId}" does not exist in payload.images`,
      });
    }
    if (!albumValues.has(relation.album_value)) {
      issues.push({
        path: `$.payload.imageAlbumRelations[${index}].album_value`,
        message: `Referenced album "${relation.album_value}" does not exist in payload.albums`,
      });
    }
  });
}

function buildWarnings(envelope: BackupEnvelopeV1): string[] {
  const warnings = [
    "This backup includes sensitive configuration values such as storage credentials and secret keys.",
    "Authentication data, sessions, passkeys, and other Better Auth tables are excluded.",
    "Object storage files are not included; only database records and URLs are backed up.",
  ];
  if (envelope.source.orm === "unknown") {
    warnings.push(
      "The backup source ORM is marked as unknown; import still uses the versioned PicImpact contract.",
    );
  }
  return warnings;
}

export function parseBackupEnvelope(input: unknown) {
  const baseResult = z
    .object({
      format: z.string().nullable().optional(),
      version: z.number().int().nullable().optional(),
      exportedAt: z.string().nullable().optional(),
      source: backupSourceSchema.nullable().optional(),
    })
    .safeParse(input);

  if (!baseResult.success) {
    throw new BackupValidationError(
      "Invalid backup package",
      createPreviewData({ issues: zodIssuesToValidationIssues(baseResult.error) }),
    );
  }

  const base = baseResult.data;
  if (base.format !== BACKUP_FORMAT) {
    throw new BackupValidationError(
      "Unsupported backup format",
      createPreviewData({
        format: base.format ?? null,
        version: base.version ?? null,
        exportedAt: base.exportedAt ?? null,
        source: base.source ?? null,
        issues: [{ path: "$.format", message: `Expected "${BACKUP_FORMAT}"` }],
      }),
    );
  }
  if (base.version !== BACKUP_VERSION_V1) {
    throw new BackupValidationError(
      "Unsupported backup version",
      createPreviewData({
        format: base.format,
        version: base.version ?? null,
        exportedAt: base.exportedAt ?? null,
        source: base.source ?? null,
        issues: [
          {
            path: "$.version",
            message: `Only backup version ${BACKUP_VERSION_V1} is supported`,
          },
        ],
      }),
    );
  }

  const envelopeResult = backupEnvelopeV1Schema.safeParse(input);
  if (!envelopeResult.success) {
    throw new BackupValidationError(
      "Invalid backup package",
      createPreviewData({
        format: base.format,
        version: base.version,
        exportedAt: base.exportedAt ?? null,
        source: base.source ?? null,
        issues: zodIssuesToValidationIssues(envelopeResult.error),
      }),
    );
  }

  const envelope = envelopeResult.data;
  const semanticIssues: BackupValidationIssue[] = [];
  appendDuplicateIssues(
    semanticIssues,
    envelope.payload.configs,
    (item) => item.config_key,
    (index) => `$.payload.configs[${index}].config_key`,
    "config_key",
  );
  appendDuplicateIssues(
    semanticIssues,
    envelope.payload.albums,
    (item) => item.album_value,
    (index) => `$.payload.albums[${index}].album_value`,
    "album_value",
  );
  appendDuplicateIssues(
    semanticIssues,
    envelope.payload.images,
    (item) => item.id,
    (index) => `$.payload.images[${index}].id`,
    "image.id",
  );
  appendDuplicateIssues(
    semanticIssues,
    envelope.payload.imageAlbumRelations,
    (item) => `${item.imageId}::${item.album_value}`,
    (index) => `$.payload.imageAlbumRelations[${index}]`,
    "image-album relation",
  );
  appendRelationReferenceIssues(envelope, semanticIssues);

  const preview = createPreviewData({
    valid: semanticIssues.length === 0,
    format: envelope.format,
    version: envelope.version,
    exportedAt: envelope.exportedAt,
    source: envelope.source,
    counts: getPreviewCounts(envelope),
    warnings: buildWarnings(envelope),
    issues: semanticIssues,
  });
  if (semanticIssues.length > 0) {
    throw new BackupValidationError("Invalid backup package", preview);
  }
  return { envelope, preview };
}
