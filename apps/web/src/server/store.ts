import { and, asc, desc, eq, inArray } from "drizzle-orm";

import type { Database } from "./db";
import { albums, configs, images, imagesAlbumsRelation } from "./db/schema";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION_V1,
  type BackupJsonValue,
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
/** 管理端相册记录：附带数据库 id（备份格式 BackupAlbumRecord 不含 id）。 */
export type AdminAlbumRecord = BackupAlbumRecord & { id: string };
export type ConfigInput = Pick<BackupConfigRecord, "config_key"> &
  Partial<Pick<BackupConfigRecord, "config_value" | "detail">>;

export type PublicImageRecord = BackupImageRecord & {
  album_value?: string;
  album_name?: string;
  album_license?: string | null;
};

export type AdminImageQuery = {
  album?: string;
  show?: number;
  camera?: string;
  lens?: string;
  page?: number;
  pageSize?: number;
};

export type AdminImageRecord = BackupImageRecord & {
  album_value?: string;
  album_name?: string;
};

export type AdminImagePage = {
  data: AdminImageRecord[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};

export type PublicImageQuery = {
  album?: string;
  page?: number;
  pageSize?: number;
};

export type PublicImagePage = {
  data: PublicImageRecord[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};

export type PublicImageNeighbors = {
  previous: PublicImageRecord | null;
  next: PublicImageRecord | null;
};

export type DashboardData = {
  summary: {
    totalImages: number;
    publicImages: number;
    totalAlbums: number;
    publicAlbums: number;
  };
  coverage: {
    publicRatio: number;
    featuredOnHome: number;
    geoTaggedImages: number;
    taggedImages: number;
  };
  recentUploads: PublicImageRecord[];
  albumBreakdown: Array<{
    name: string;
    album_value: string;
    total: number;
    publicCount: number;
  }>;
  equipmentBreakdown: Array<{
    camera: string;
    lens: string;
    count: number;
  }>;
};

export interface PicImpactStore {
  getSource(): BackupSource;
  listImages(): Promise<BackupImageRecord[]>;
  listAlbums(): Promise<BackupAlbumRecord[]>;
  listAdminAlbums(): Promise<AdminAlbumRecord[]>;
  listConfigs(): Promise<BackupConfigRecord[]>;
  listImageRelations(): Promise<BackupImageAlbumRelationRecord[]>;
  listAdminImages(query?: AdminImageQuery): Promise<AdminImagePage>;
  upsertImage(input: PhotoInput): Promise<BackupImageRecord>;
  upsertAlbum(input: AlbumInput): Promise<BackupAlbumRecord>;
  updateAlbum(id: string, input: AlbumInput): Promise<BackupAlbumRecord | null>;
  updateAlbumShow(id: string, show: number): Promise<void>;
  deleteAlbum(id: string): Promise<boolean>;
  upsertConfig(input: ConfigInput): Promise<BackupConfigRecord>;
  setImageAlbum(imageId: string, albumValue: string): Promise<void>;
  deleteImage(id: string): Promise<boolean>;
  deleteImages(ids: string[]): Promise<number>;
  listPublicAlbums(): Promise<BackupAlbumRecord[]>;
  listPublicImages(query?: PublicImageQuery): Promise<PublicImagePage>;
  getPublicImage(id: string): Promise<PublicImageRecord | null>;
  getPublicImageNeighbors(
    id: string,
    album?: string,
  ): Promise<PublicImageNeighbors>;
  getDashboard(): Promise<DashboardData>;
  exportSnapshot(): Promise<BackupPayloadV1>;
  importSnapshot(payload: BackupPayloadV1): Promise<BackupImportResult["entities"]>;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeDate(value: string | null | undefined, fallback: string) {
  return value ?? fallback;
}

export function normalizeImage(input: PhotoInput, existing?: BackupImageRecord): BackupImageRecord {
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

export function normalizeAlbum(input: AlbumInput, existing?: BackupAlbumRecord): BackupAlbumRecord {
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

export function normalizeConfig(input: ConfigInput, existing?: BackupConfigRecord): BackupConfigRecord {
  return {
    config_key: input.config_key,
    config_value: input.config_value ?? existing?.config_value ?? null,
    detail: input.detail ?? existing?.detail ?? null,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
}

export function countEntities<T extends { id?: string; config_key?: string; album_value?: string }>(
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

export function relationKey(relation: BackupImageAlbumRelationRecord) {
  return `${relation.imageId}::${relation.album_value}`;
}

type PublicRelation = BackupImageAlbumRelationRecord;

export function compareImages(left: BackupImageRecord, right: BackupImageRecord) {
  return (
    right.sort - left.sort ||
    right.createdAt.localeCompare(left.createdAt) ||
    (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "") ||
    left.id.localeCompare(right.id)
  );
}

export function buildPublicImage(
  image: BackupImageRecord,
  album?: BackupAlbumRecord,
): PublicImageRecord {
  return {
    ...image,
    ...(album
      ? {
          album_value: album.album_value,
          album_name: album.name,
          album_license: album.license,
        }
      : {}),
  };
}

export function findPublicAlbums(albums: BackupAlbumRecord[]) {
  return albums
    .filter((album) => album.del === 0 && album.show === 0 && album.album_value !== "/")
    .sort(
      (left, right) =>
        right.sort - left.sort ||
        left.name.localeCompare(right.name) ||
        left.album_value.localeCompare(right.album_value),
    );
}

function normalizeAdminQuery(query?: AdminImageQuery) {
  const page = Math.max(1, Math.floor(query?.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(query?.pageSize ?? 8)));
  const album = query?.album?.trim() ?? "";
  const show = typeof query?.show === "number" ? query.show : -1;
  const camera = query?.camera?.trim() ?? "";
  const lens = query?.lens?.trim() ?? "";
  return { page, pageSize, album, show, camera, lens };
}

export function createAdminImagePage(
  images: BackupImageRecord[],
  albums: BackupAlbumRecord[],
  relations: BackupImageAlbumRelationRecord[],
  query?: AdminImageQuery,
): AdminImagePage {
  const { page, pageSize, album, show, camera, lens } = normalizeAdminQuery(query);
  const albumMap = new Map(albums.map((item) => [item.album_value, item]));
  const relationMap = new Map<string, string[]>();
  for (const relation of relations) {
    const related = relationMap.get(relation.imageId) ?? [];
    related.push(relation.album_value);
    relationMap.set(relation.imageId, related);
  }

  const filtered = images
    .filter((image) => image.del === 0)
    .filter((image) => show < 0 || image.show === show)
    .filter((image) => {
      if (!camera) return true;
      return getExifField(image, "model") === camera;
    })
    .filter((image) => {
      if (!lens) return true;
      return getExifField(image, "lens_model") === lens;
    })
    .filter((image) => {
      if (!album) return true;
      return relationMap.get(image.id)?.includes(album) ?? false;
    })
    .sort(compareImages)
    .map((image) => {
      const relatedAlbum = album
        ? albumMap.get(album)
        : albumMap.get(relationMap.get(image.id)?.[0] ?? "");
      return {
        ...image,
        ...(relatedAlbum ? { album_value: relatedAlbum.album_value, album_name: relatedAlbum.name } : {}),
      };
    });

  const total = filtered.length;
  const pages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  return {
    data: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    pages,
  };
}

function findPublicFeed(
  images: BackupImageRecord[],
  albums: BackupAlbumRecord[],
  relations: PublicRelation[],
  albumValue = "/",
) {
  const albumMap = new Map(albums.map((album) => [album.album_value, album]));
  const relationMap = new Map<string, string[]>();
  for (const relation of relations) {
    const related = relationMap.get(relation.imageId) ?? [];
    related.push(relation.album_value);
    relationMap.set(relation.imageId, related);
  }

  const visibleImages = images
    .filter((image) => image.del === 0 && image.show === 0)
    .flatMap((image) => {
      if (albumValue === "/") {
        return image.show_on_mainpage === 0 ? [buildPublicImage(image)] : [];
      }
      const album = albumMap.get(albumValue);
      if (!album || album.del !== 0 || album.show !== 0) return [];
      if (!relationMap.get(image.id)?.includes(albumValue)) return [];
      return [buildPublicImage(image, album)];
    })
    .sort(compareImages);

  return { images: visibleImages, albumMap };
}

function normalizePageQuery(query?: PublicImageQuery) {
  const page = Math.max(1, Math.floor(query?.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(query?.pageSize ?? 24)));
  const rawAlbum = query?.album?.trim() || "/";
  const album = rawAlbum === "/" || rawAlbum.startsWith("/") ? rawAlbum : `/${rawAlbum}`;
  return { album, page, pageSize };
}

function resolveAlbumValue(albumValue: string, albums: BackupAlbumRecord[]) {
  if (albumValue === "/") return "/";
  if (albums.some((album) => album.album_value === albumValue)) return albumValue;
  const alternate = albumValue.startsWith("/")
    ? albumValue.slice(1)
    : `/${albumValue}`;
  return albums.some((album) => album.album_value === alternate) ? alternate : albumValue;
}

export function createPublicImagePage(
  images: BackupImageRecord[],
  albums: BackupAlbumRecord[],
  relations: PublicRelation[],
  query?: PublicImageQuery,
): PublicImagePage {
  const { album: requestedAlbum, page, pageSize } = normalizePageQuery(query);
  const album = resolveAlbumValue(requestedAlbum, albums);
  const feed = findPublicFeed(images, albums, relations, album);
  const total = feed.images.length;
  const pages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  return {
    data: feed.images.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    pages,
  };
}

export function createPublicImageNeighbors(
  images: BackupImageRecord[],
  albums: BackupAlbumRecord[],
  relations: PublicRelation[],
  id: string,
  albumValue = "/",
): PublicImageNeighbors {
  const feed = findPublicFeed(
    images,
    albums,
    relations,
    resolveAlbumValue(albumValue, albums),
  ).images;
  const index = feed.findIndex((image) => image.id === id);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: feed[index - 1] ?? null,
    next: feed[index + 1] ?? null,
  };
}

export function imageAlbumFor(
  imageId: string,
  albums: BackupAlbumRecord[],
  relations: PublicRelation[],
) {
  const albumMap = new Map(albums.map((album) => [album.album_value, album]));
  return relations
    .filter((relation) => relation.imageId === imageId)
    .map((relation) => albumMap.get(relation.album_value))
    .find((album) => album?.del === 0 && album.show === 0);
}

function getExifField(image: BackupImageRecord, key: string) {
  if (!image.exif || typeof image.exif !== "object" || Array.isArray(image.exif)) return null;
  const value = (image.exif as Record<string, BackupJsonValue>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function createDashboardData(
  images: BackupImageRecord[],
  albums: BackupAlbumRecord[],
  relations: PublicRelation[],
): DashboardData {
  const activeImages = images.filter((image) => image.del === 0);
  const activeAlbums = albums.filter((album) => album.del === 0);
  const publicImages = activeImages.filter((image) => image.show === 0);
  const publicAlbums = activeAlbums.filter((album) => album.show === 0);
  const albumMap = new Map(activeAlbums.map((album) => [album.album_value, album]));
  const albumCounts = new Map<
    string,
    { name: string; album_value: string; total: number; publicCount: number }
  >();

  for (const relation of relations) {
    const album = albumMap.get(relation.album_value);
    const image = activeImages.find((item) => item.id === relation.imageId);
    if (!album || !image) continue;
    const current = albumCounts.get(album.album_value) ?? {
      name: album.name,
      album_value: album.album_value,
      total: 0,
      publicCount: 0,
    };
    current.total += 1;
    if (image.show === 0) current.publicCount += 1;
    albumCounts.set(album.album_value, current);
  }

  const equipmentCounts = new Map<string, { camera: string; lens: string; count: number }>();
  for (const image of activeImages) {
    const camera = getExifField(image, "model") ?? "Unknown";
    const lens = getExifField(image, "lens_model") ?? "Unknown";
    const key = `${camera}::${lens}`;
    const current = equipmentCounts.get(key) ?? { camera, lens, count: 0 };
    current.count += 1;
    equipmentCounts.set(key, current);
  }

  const recentUploads = [...activeImages]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 6)
    .map((image) => buildPublicImage(image, imageAlbumFor(image.id, albums, relations)));

  return {
    summary: {
      totalImages: activeImages.length,
      publicImages: publicImages.length,
      totalAlbums: activeAlbums.length,
      publicAlbums: publicAlbums.length,
    },
    coverage: {
      publicRatio:
        activeImages.length === 0
          ? 0
          : Number(((publicImages.length / activeImages.length) * 100).toFixed(1)),
      featuredOnHome: activeImages.filter((image) => image.show_on_mainpage === 0).length,
      geoTaggedImages: activeImages.filter((image) => Boolean(image.lat && image.lon)).length,
      taggedImages: activeImages.filter(
        (image) => Array.isArray(image.labels) && image.labels.length > 0,
      ).length,
    },
    recentUploads,
    albumBreakdown: [...albumCounts.values()]
      .sort((left, right) => right.total - left.total || left.name.localeCompare(right.name))
      .slice(0, 6),
    equipmentBreakdown: [...equipmentCounts.values()]
      .sort((left, right) => right.count - left.count || left.camera.localeCompare(right.camera))
      .slice(0, 6),
  };
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

  async listAdminAlbums() {
    const rows = await this.db
      .select()
      .from(albums)
      .where(eq(albums.del, 0))
      .orderBy(desc(albums.sort), asc(albums.createdAt), asc(albums.album_value));
    return rows.map((row) => ({ ...asAlbumRecord(row), id: String(row.id) }));
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

  /** 更新相册（按 id）；album_value 变更时同步关联表，参考 v3 updateAlbum。 */
  async updateAlbum(id: string, input: AlbumInput) {
    const rows = await this.db.select().from(albums).where(eq(albums.id, id));
    const row = rows[0];
    if (!row) return null;
    const existing = asAlbumRecord(row);
    const album = normalizeAlbum(input, existing);
    await this.db.transaction(async (tx) => {
      await tx
        .update(albums)
        .set({
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
          updatedAt: new Date(),
        })
        .where(eq(albums.id, id));
      if (album.album_value !== existing.album_value) {
        await tx
          .update(imagesAlbumsRelation)
          .set({ album_value: album.album_value })
          .where(eq(imagesAlbumsRelation.album_value, existing.album_value));
      }
    });
    return album;
  }

  /** 更新相册显示状态：0=显示，1=隐藏。 */
  async updateAlbumShow(id: string, show: number) {
    await this.db
      .update(albums)
      .set({ show, updatedAt: new Date() })
      .where(eq(albums.id, id));
  }

  /** 逻辑删除相册（del=1），与 v3 一致，保留图片-相册关联。 */
  async deleteAlbum(id: string) {
    const targets = await this.db
      .select({ id: albums.id })
      .from(albums)
      .where(and(eq(albums.id, id), eq(albums.del, 0)));
    if (targets.length === 0) return false;
    await this.db
      .update(albums)
      .set({ del: 1, updatedAt: new Date() })
      .where(eq(albums.id, id));
    return true;
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

  async listImageRelations() {
    const rows = await this.db
      .select({
        imageId: imagesAlbumsRelation.imageId,
        album_value: imagesAlbumsRelation.album_value,
      })
      .from(imagesAlbumsRelation);
    return rows as BackupImageAlbumRelationRecord[];
  }

  async listAdminImages(query?: AdminImageQuery) {
    const [imageRecords, albumRecords, relations] = await Promise.all([
      this.listImages(),
      this.listAlbums(),
      this.listImageRelations(),
    ]);
    return createAdminImagePage(imageRecords, albumRecords, relations, query);
  }

  async setImageAlbum(imageId: string, albumValue: string) {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(imagesAlbumsRelation)
        .where(eq(imagesAlbumsRelation.imageId, imageId));
      await tx
        .insert(imagesAlbumsRelation)
        .values({ imageId, album_value: albumValue })
        .onConflictDoNothing();
    });
  }

  async deleteImage(id: string) {
    return (await this.deleteImages([id])) > 0;
  }

  async deleteImages(ids: string[]) {
    const idSet = [...new Set(ids)];
    if (idSet.length === 0) return 0;
    let deleted = 0;
    await this.db.transaction(async (tx) => {
      const targets = await tx
        .select({ id: images.id })
        .from(images)
        .where(and(inArray(images.id, idSet), eq(images.del, 0)));
      if (targets.length > 0) {
        await tx
          .update(images)
          .set({ del: 1, updatedAt: new Date() })
          .where(inArray(images.id, targets.map((row) => row.id)));
      }
      deleted = targets.length;
      await tx
        .delete(imagesAlbumsRelation)
        .where(inArray(imagesAlbumsRelation.imageId, idSet));
    });
    return deleted;
  }

  private async loadPublicData() {
    const [imageRecords, albumRecords, relationRows] = await Promise.all([
      this.listImages(),
      this.listAlbums(),
      this.db
        .select({
          imageId: imagesAlbumsRelation.imageId,
          album_value: imagesAlbumsRelation.album_value,
        })
        .from(imagesAlbumsRelation),
    ]);
    return {
      imageRecords,
      albumRecords,
      relations: relationRows as BackupImageAlbumRelationRecord[],
    };
  }

  async listPublicAlbums() {
    return findPublicAlbums(await this.listAlbums());
  }

  async listPublicImages(query?: PublicImageQuery) {
    const { imageRecords, albumRecords, relations } = await this.loadPublicData();
    return createPublicImagePage(imageRecords, albumRecords, relations, query);
  }

  async getPublicImage(id: string) {
    const { imageRecords, albumRecords, relations } = await this.loadPublicData();
    const image = imageRecords.find((item) => item.id === id && item.del === 0 && item.show === 0);
    if (!image) return null;
    return buildPublicImage(image, imageAlbumFor(id, albumRecords, relations));
  }

  async getPublicImageNeighbors(id: string, album = "/") {
    const { imageRecords, albumRecords, relations } = await this.loadPublicData();
    return createPublicImageNeighbors(imageRecords, albumRecords, relations, id, album);
  }

  async getDashboard() {
    const { imageRecords, albumRecords, relations } = await this.loadPublicData();
    return createDashboardData(imageRecords, albumRecords, relations);
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
