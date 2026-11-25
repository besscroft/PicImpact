import { asc, desc, eq, inArray } from "drizzle-orm";

import { createNeonDb, type Database } from "./db";
import { albums, configs, images, imagesAlbumsRelation } from "./db/schema";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION_V1,
  type BackupAlbumRecord,
  type BackupConfigRecord,
  type BackupEnvelopeV1,
  type BackupImageAlbumRelationRecord,
  type BackupImageRecord,
  type BackupImportResult,
  type BackupPayloadV1,
  type BackupSource,
} from "./backup/types";
import { parseBackupEnvelope } from "./backup/format";

export type PhotoInput = Partial<BackupImageRecord> &
  Pick<BackupImageRecord, "id"> & {
    image_key?: string | null;
    variants_ready?: boolean;
    ready_max_width?: number;
  };
export type AlbumInput = Partial<BackupAlbumRecord> &
  Pick<BackupAlbumRecord, "album_value" | "name">;
export type ConfigInput = Pick<BackupConfigRecord, "config_key"> &
  Partial<Pick<BackupConfigRecord, "config_value" | "detail">>;

export interface PicImpactStore {
  getSource(): BackupSource;
  listImages(): Promise<BackupImageRecord[]>;
  listAlbums(): Promise<BackupAlbumRecord[]>;
  listConfigs(): Promise<BackupConfigRecord[]>;
  upsertImage(input: PhotoInput): Promise<BackupImageRecord>;
  upsertAlbum(input: AlbumInput): Promise<BackupAlbumRecord>;
  upsertConfig(input: ConfigInput): Promise<BackupConfigRecord>;
  exportSnapshot(): Promise<BackupPayloadV1>;
  importSnapshot(payload: BackupPayloadV1): Promise<BackupImportResult["entities"]>;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeDate(value: string | null | undefined, fallback: string) {
  return value ?? fallback;
}

function normalizeImage(input: PhotoInput, existing?: BackupImageRecord): BackupImageRecord {
  const createdAt = normalizeDate(input.createdAt, existing?.createdAt ?? nowIso());
  return {
    id: input.id,
    image_name: input.image_name ?? existing?.image_name ?? null,
    url: input.url ?? existing?.url ?? null,
    preview_url: input.preview_url ?? existing?.preview_url ?? null,
    video_url: input.video_url ?? existing?.video_url ?? null,
    blurhash: input.blurhash ?? existing?.blurhash ?? null,
    exif: input.exif ?? existing?.exif ?? null,
    labels: input.labels ?? existing?.labels ?? null,
    width: input.width ?? existing?.width ?? 0,
    height: input.height ?? existing?.height ?? 0,
    lon: input.lon ?? existing?.lon ?? null,
    lat: input.lat ?? existing?.lat ?? null,
    title: input.title ?? existing?.title ?? null,
    detail: input.detail ?? existing?.detail ?? null,
    type: input.type ?? existing?.type ?? 1,
    show: input.show ?? existing?.show ?? 1,
    show_on_mainpage: input.show_on_mainpage ?? existing?.show_on_mainpage ?? 1,
    sort: input.sort ?? existing?.sort ?? 0,
    del: input.del ?? existing?.del ?? 0,
    createdAt,
    updatedAt: input.updatedAt ?? existing?.updatedAt ?? null,
  };
}

function normalizeAlbum(input: AlbumInput, existing?: BackupAlbumRecord): BackupAlbumRecord {
  const createdAt = normalizeDate(input.createdAt, existing?.createdAt ?? nowIso());
  return {
    album_value: input.album_value,
    name: input.name,
    detail: input.detail ?? existing?.detail ?? null,
    theme: input.theme ?? existing?.theme ?? "0",
    show: input.show ?? existing?.show ?? 1,
    sort: input.sort ?? existing?.sort ?? 0,
    random_show: input.random_show ?? existing?.random_show ?? 1,
    license: input.license ?? existing?.license ?? null,
    image_sorting: input.image_sorting ?? existing?.image_sorting ?? 1,
    daily_weight: input.daily_weight ?? existing?.daily_weight ?? 0,
    del: input.del ?? existing?.del ?? 0,
    createdAt,
    updatedAt: input.updatedAt ?? existing?.updatedAt ?? null,
  };
}

function normalizeConfig(input: ConfigInput, existing?: BackupConfigRecord): BackupConfigRecord {
  return {
    config_key: input.config_key,
    config_value: input.config_value ?? existing?.config_value ?? null,
    detail: input.detail ?? existing?.detail ?? null,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
}

function countEntities<T extends { id?: string; config_key?: string; album_value?: string }>(
  incoming: T[],
  existing: T[],
  key: keyof T,
) {
  const existingKeys = new Set(existing.map((item) => item[key]));
  return {
    totalCount: incoming.length,
    createdCount: incoming.filter((item) => !existingKeys.has(item[key])).length,
    updatedCount: incoming.filter((item) => existingKeys.has(item[key])).length,
  };
}

function relationKey(relation: BackupImageAlbumRelationRecord) {
  return `${relation.imageId}::${relation.album_value}`;
}

export class MemoryPicImpactStore implements PicImpactStore {
  private readonly imageMap = new Map<string, BackupImageRecord>();
  private readonly albumMap = new Map<string, BackupAlbumRecord>();
  private readonly configMap = new Map<string, BackupConfigRecord>();
  private relations = new Set<string>();

  getSource(): BackupSource {
    return { orm: "drizzle", database: "postgresql" };
  }

  async listImages() {
    return [...this.imageMap.values()].sort((left, right) => right.sort - left.sort);
  }

  async listAlbums() {
    return [...this.albumMap.values()].sort((left, right) => right.sort - left.sort);
  }

  async listConfigs() {
    return [...this.configMap.values()].sort((left, right) =>
      left.config_key.localeCompare(right.config_key),
    );
  }

  async upsertImage(input: PhotoInput) {
    const image = normalizeImage(input, this.imageMap.get(input.id));
    this.imageMap.set(image.id, image);
    return image;
  }

  async upsertAlbum(input: AlbumInput) {
    const album = normalizeAlbum(input, this.albumMap.get(input.album_value));
    this.albumMap.set(album.album_value, album);
    return album;
  }

  async upsertConfig(input: ConfigInput) {
    const config = normalizeConfig(input, this.configMap.get(input.config_key));
    this.configMap.set(config.config_key, config);
    return config;
  }

  async exportSnapshot(): Promise<BackupPayloadV1> {
    return {
      configs: await this.listConfigs(),
      albums: await this.listAlbums(),
      images: await this.listImages(),
      imageAlbumRelations: [...this.relations].map((value) => {
        const [imageId, album_value] = value.split("::");
        return { imageId, album_value };
      }),
    };
  }

  async importSnapshot(payload: BackupPayloadV1) {
    const existing = await this.exportSnapshot();
    for (const config of payload.configs) await this.upsertConfig(config);
    for (const album of payload.albums) await this.upsertAlbum(album);
    for (const image of payload.images) await this.upsertImage(image);

    const importedImageIds = new Set(payload.images.map((image) => image.id));
    this.relations = new Set(
      [...this.relations].filter((value) => !importedImageIds.has(value.split("::")[0])),
    );
    payload.imageAlbumRelations.forEach((relation) => this.relations.add(relationKey(relation)));

    const existingRelations = new Set(existing.imageAlbumRelations.map(relationKey));
    const incomingRelations = new Set(payload.imageAlbumRelations.map(relationKey));
    const replacedImageCount = new Set(
      payload.imageAlbumRelations.map((relation) => relation.imageId),
    ).size;
    return {
      configs: countEntities(payload.configs, existing.configs, "config_key"),
      albums: countEntities(payload.albums, existing.albums, "album_value"),
      images: countEntities(payload.images, existing.images, "id"),
      imageAlbumRelations: {
        totalCount: payload.imageAlbumRelations.length,
        addedCount: [...incomingRelations].filter((key) => !existingRelations.has(key)).length,
        unchangedCount: [...incomingRelations].filter((key) => existingRelations.has(key)).length,
        replacedImageCount,
        removedCount: [...existingRelations].filter((key) => !incomingRelations.has(key)).length,
      },
    };
  }
}

type DrizzleRow = Record<string, unknown>;

function asImageRecord(row: DrizzleRow): BackupImageRecord {
  return {
    id: String(row.id),
    image_name: (row.image_name as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    preview_url: (row.preview_url as string | null) ?? null,
    video_url: (row.video_url as string | null) ?? null,
    blurhash: (row.blurhash as string | null) ?? null,
    exif: (row.exif as BackupImageRecord["exif"]) ?? null,
    labels: (row.labels as BackupImageRecord["labels"]) ?? null,
    width: Number(row.width ?? 0),
    height: Number(row.height ?? 0),
    lon: (row.lon as string | null) ?? null,
    lat: (row.lat as string | null) ?? null,
    title: (row.title as string | null) ?? null,
    detail: (row.detail as string | null) ?? null,
    type: Number(row.type ?? 1),
    show: Number(row.show ?? 1),
    show_on_mainpage: Number(row.show_on_mainpage ?? 1),
    sort: Number(row.sort ?? 0),
    del: Number(row.del ?? 0),
    createdAt: new Date(row.createdAt as Date).toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt as Date).toISOString() : null,
  };
}

function asAlbumRecord(row: DrizzleRow): BackupAlbumRecord {
  return {
    album_value: String(row.album_value),
    name: String(row.name),
    detail: (row.detail as string | null) ?? null,
    theme: (row.theme as string | null) ?? "0",
    show: Number(row.show ?? 1),
    sort: Number(row.sort ?? 0),
    random_show: Number(row.random_show ?? 1),
    license: (row.license as string | null) ?? null,
    image_sorting: Number(row.image_sorting ?? 1),
    daily_weight: Number(row.daily_weight ?? 0),
    del: Number(row.del ?? 0),
    createdAt: new Date(row.createdAt as Date).toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt as Date).toISOString() : null,
  };
}

function asConfigRecord(row: DrizzleRow): BackupConfigRecord {
  return {
    config_key: String(row.config_key),
    config_value: (row.config_value as string | null) ?? null,
    detail: (row.detail as string | null) ?? null,
    createdAt: new Date(row.createdAt as Date).toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt as Date).toISOString() : null,
  };
}

export class DrizzlePicImpactStore implements PicImpactStore {
  constructor(private readonly db: Database) {}

  getSource(): BackupSource {
    return { orm: "drizzle", database: "postgresql" };
  }

  async listImages() {
    const rows = await this.db
      .select()
      .from(images)
      .orderBy(desc(images.sort), asc(images.createdAt), asc(images.id));
    return rows.map((row) => asImageRecord(row));
  }

  async listAlbums() {
    const rows = await this.db
      .select()
      .from(albums)
      .orderBy(desc(albums.sort), asc(albums.createdAt), asc(albums.album_value));
    return rows.map((row) => asAlbumRecord(row));
  }

  async listConfigs() {
    const rows = await this.db.select().from(configs).orderBy(asc(configs.config_key));
    return rows.map((row) => asConfigRecord(row));
  }

  async upsertImage(input: PhotoInput) {
    const existing = (await this.listImages()).find((item) => item.id === input.id);
    const image = normalizeImage(input, existing);
    await this.db
      .insert(images)
      .values({
        id: image.id,
        image_name: image.image_name,
        url: image.url,
        preview_url: image.preview_url,
        video_url: image.video_url,
        blurhash: image.blurhash,
        image_key: input.image_key ?? null,
        variants_ready: input.variants_ready ?? false,
        ready_max_width: input.ready_max_width ?? 0,
        exif: image.exif,
        labels: image.labels,
        width: image.width,
        height: image.height,
        lon: image.lon,
        lat: image.lat,
        title: image.title,
        detail: image.detail,
        type: image.type,
        show: image.show,
        show_on_mainpage: image.show_on_mainpage,
        sort: image.sort,
        del: image.del,
        createdAt: new Date(image.createdAt),
        updatedAt: image.updatedAt ? new Date(image.updatedAt) : null,
      })
      .onConflictDoUpdate({
        target: images.id,
        set: {
          image_name: image.image_name,
          url: image.url,
          preview_url: image.preview_url,
          video_url: image.video_url,
          blurhash: image.blurhash,
          ...(input.image_key === undefined ? {} : { image_key: input.image_key }),
          ...(input.variants_ready === undefined ? {} : { variants_ready: input.variants_ready }),
          ...(input.ready_max_width === undefined
            ? {}
            : { ready_max_width: input.ready_max_width }),
          exif: image.exif,
          labels: image.labels,
          width: image.width,
          height: image.height,
          lon: image.lon,
          lat: image.lat,
          title: image.title,
          detail: image.detail,
          type: image.type,
          show: image.show,
          show_on_mainpage: image.show_on_mainpage,
          sort: image.sort,
          del: image.del,
          createdAt: new Date(image.createdAt),
          updatedAt: new Date(),
        },
      });
    return image;
  }

  async upsertAlbum(input: AlbumInput) {
    const existing = (await this.listAlbums()).find(
      (item) => item.album_value === input.album_value,
    );
    const album = normalizeAlbum(input, existing);
    await this.db
      .insert(albums)
      .values({
        id: existing ? await this.getAlbumId(album.album_value) : crypto.randomUUID(),
        album_value: album.album_value,
        name: album.name,
        detail: album.detail,
        theme: album.theme,
        show: album.show,
        sort: album.sort,
        random_show: album.random_show,
        license: album.license,
        image_sorting: album.image_sorting,
        daily_weight: album.daily_weight,
        del: album.del,
        createdAt: new Date(album.createdAt),
        updatedAt: album.updatedAt ? new Date(album.updatedAt) : null,
      })
      .onConflictDoUpdate({
        target: albums.album_value,
        set: {
          name: album.name,
          detail: album.detail,
          theme: album.theme,
          show: album.show,
          sort: album.sort,
          random_show: album.random_show,
          license: album.license,
          image_sorting: album.image_sorting,
          daily_weight: album.daily_weight,
          del: album.del,
          createdAt: new Date(album.createdAt),
          updatedAt: new Date(),
        },
      });
    return album;
  }

  async upsertConfig(input: ConfigInput) {
    const existing = (await this.listConfigs()).find(
      (item) => item.config_key === input.config_key,
    );
    const config = normalizeConfig(input, existing);
    await this.db
      .insert(configs)
      .values({
        id: existing ? await this.getConfigId(config.config_key) : crypto.randomUUID(),
        config_key: config.config_key,
        config_value: config.config_value,
        detail: config.detail,
        createdAt: new Date(config.createdAt),
        updatedAt: config.updatedAt ? new Date(config.updatedAt) : null,
      })
      .onConflictDoUpdate({
        target: configs.config_key,
        set: {
          config_value: config.config_value,
          detail: config.detail,
          updatedAt: new Date(),
        },
      });
    return config;
  }

  private async getAlbumId(albumValue: string) {
    const rows = await this.db
      .select({ id: albums.id })
      .from(albums)
      .where(eq(albums.album_value, albumValue));
    return rows[0]?.id ?? crypto.randomUUID();
  }

  private async getConfigId(configKey: string) {
    const rows = await this.db
      .select({ id: configs.id })
      .from(configs)
      .where(eq(configs.config_key, configKey));
    return rows[0]?.id ?? crypto.randomUUID();
  }

  async exportSnapshot(): Promise<BackupPayloadV1> {
    const [configRecords, albumRecords, imageRecords, relationRecords] = await Promise.all([
      this.listConfigs(),
      this.listAlbums(),
      this.listImages(),
      this.db.select().from(imagesAlbumsRelation).orderBy(asc(imagesAlbumsRelation.imageId)),
    ]);
    return {
      configs: configRecords,
      albums: albumRecords,
      images: imageRecords,
      imageAlbumRelations: relationRecords,
    };
  }

  async importSnapshot(payload: BackupPayloadV1) {
    const existing = await this.exportSnapshot();
    await this.db.transaction(async (tx) => {
      for (const config of payload.configs) {
        await tx
          .insert(configs)
          .values({
            id: crypto.randomUUID(),
            config_key: config.config_key,
            config_value: config.config_value,
            detail: config.detail,
            createdAt: new Date(config.createdAt),
            updatedAt: config.updatedAt ? new Date(config.updatedAt) : null,
          })
          .onConflictDoUpdate({
            target: configs.config_key,
            set: {
              config_value: config.config_value,
              detail: config.detail,
              updatedAt: config.updatedAt ? new Date(config.updatedAt) : new Date(),
            },
          });
      }
      for (const album of payload.albums) {
        await tx
          .insert(albums)
          .values({
            id: crypto.randomUUID(),
            album_value: album.album_value,
            name: album.name,
            detail: album.detail,
            theme: album.theme,
            show: album.show,
            sort: album.sort,
            random_show: album.random_show,
            license: album.license,
            image_sorting: album.image_sorting,
            daily_weight: album.daily_weight,
            del: album.del,
            createdAt: new Date(album.createdAt),
            updatedAt: album.updatedAt ? new Date(album.updatedAt) : null,
          })
          .onConflictDoUpdate({
            target: albums.album_value,
            set: {
              name: album.name,
              detail: album.detail,
              theme: album.theme,
              show: album.show,
              sort: album.sort,
              random_show: album.random_show,
              license: album.license,
              image_sorting: album.image_sorting,
              daily_weight: album.daily_weight,
              del: album.del,
              createdAt: new Date(album.createdAt),
              updatedAt: album.updatedAt ? new Date(album.updatedAt) : new Date(),
            },
          });
      }
      for (const image of payload.images) {
        await tx
          .insert(images)
          .values({
            id: image.id,
            image_name: image.image_name,
            url: image.url,
            preview_url: image.preview_url,
            video_url: image.video_url,
            blurhash: image.blurhash,
            image_key: null,
            variants_ready: false,
            ready_max_width: 0,
            exif: image.exif,
            labels: image.labels,
            width: image.width,
            height: image.height,
            lon: image.lon,
            lat: image.lat,
            title: image.title,
            detail: image.detail,
            type: image.type,
            show: image.show,
            show_on_mainpage: image.show_on_mainpage,
            sort: image.sort,
            del: image.del,
            createdAt: new Date(image.createdAt),
            updatedAt: image.updatedAt ? new Date(image.updatedAt) : null,
          })
          .onConflictDoUpdate({
            target: images.id,
            set: {
              image_name: image.image_name,
              url: image.url,
              preview_url: image.preview_url,
              video_url: image.video_url,
              blurhash: image.blurhash,
              exif: image.exif,
              labels: image.labels,
              width: image.width,
              height: image.height,
              lon: image.lon,
              lat: image.lat,
              title: image.title,
              detail: image.detail,
              type: image.type,
              show: image.show,
              show_on_mainpage: image.show_on_mainpage,
              sort: image.sort,
              del: image.del,
              createdAt: new Date(image.createdAt),
              updatedAt: image.updatedAt ? new Date(image.updatedAt) : new Date(),
            },
          });
      }
      const imageIds = payload.images.map((image) => image.id);
      if (imageIds.length > 0) {
        await tx
          .delete(imagesAlbumsRelation)
          .where(inArray(imagesAlbumsRelation.imageId, imageIds));
      }
      if (payload.imageAlbumRelations.length > 0) {
        await tx
          .insert(imagesAlbumsRelation)
          .values(payload.imageAlbumRelations)
          .onConflictDoNothing();
      }
    });

    const existingRelations = new Set(existing.imageAlbumRelations.map(relationKey));
    const incomingRelations = new Set(payload.imageAlbumRelations.map(relationKey));
    return {
      configs: countEntities(payload.configs, existing.configs, "config_key"),
      albums: countEntities(payload.albums, existing.albums, "album_value"),
      images: countEntities(payload.images, existing.images, "id"),
      imageAlbumRelations: {
        totalCount: payload.imageAlbumRelations.length,
        addedCount: [...incomingRelations].filter((key) => !existingRelations.has(key)).length,
        unchangedCount: [...incomingRelations].filter((key) => existingRelations.has(key)).length,
        replacedImageCount: new Set(payload.imageAlbumRelations.map((relation) => relation.imageId))
          .size,
        removedCount: [...existingRelations].filter((key) => !incomingRelations.has(key)).length,
      },
    };
  }
}

export type StoreEnv = {
  DATABASE_URL?: string;
};

export function createStore(env: StoreEnv): PicImpactStore {
  if (env.DATABASE_URL) {
    return new DrizzlePicImpactStore(createNeonDb(env.DATABASE_URL));
  }
  return new MemoryPicImpactStore();
}

export async function exportBackup(store: PicImpactStore): Promise<BackupEnvelopeV1> {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION_V1,
    exportedAt: nowIso(),
    source: store.getSource(),
    payload: await store.exportSnapshot(),
  };
}

export async function importBackup(store: PicImpactStore, input: unknown) {
  const { envelope, preview } = parseBackupEnvelope(input);
  const entities = await store.importSnapshot(envelope.payload);
  const importedAt = nowIso();
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION_V1,
    importedAt,
    source: envelope.source,
    counts: preview.counts,
    warnings: preview.warnings,
    entities,
    dailyRefresh: {
      refreshed: false,
      refreshedAt: null,
      message: "Daily materialized data is outside the v4 scope.",
    },
  } satisfies BackupImportResult;
}
