import {
  buildPublicImage,
  countEntities,
  createAdminImagePage,
  createDashboardData,
  createPublicImageNeighbors,
  createPublicImagePage,
  findPublicAlbums,
  imageAlbumFor,
  normalizeAlbum,
  normalizeConfig,
  normalizeImage,
  relationKey,
  type AlbumInput,
  type AdminImageQuery,
  type ConfigInput,
  type PhotoInput,
  type PicImpactStore,
} from "../src/server/store";
import type {
  BackupAlbumRecord,
  BackupConfigRecord,
  BackupImageAlbumRelationRecord,
  BackupImageRecord,
  BackupImportResult,
  BackupPayloadV1,
  BackupSource,
} from "../src/server/backup/types";
import { encodePath, type ObjectStorage, type StoredObject } from "../src/server/storage";

/**
 * 测试专用内存实现：源码中的 memory 存储层已移除，这里仅为单测提供隔离环境。
 */
export class MemoryObjectStorage implements ObjectStorage {
  private readonly objects = new Map<string, StoredObject>();

  async put(input: {
    key: string;
    body: ArrayBuffer | Uint8Array;
    contentType: string;
    contentLength: number;
  }) {
    const body = input.body instanceof Uint8Array ? input.body : new Uint8Array(input.body);
    this.objects.set(input.key, {
      body: new Uint8Array(body),
      contentType: input.contentType,
    });
  }

  async get(key: string) {
    const object = this.objects.get(key);
    return object
      ? {
          body: new Uint8Array(object.body),
          contentType: object.contentType,
        }
      : null;
  }

  url(key: string, requestOrigin: string) {
    return `${requestOrigin}/api/storage/${encodePath(key)}`;
  }
}

function nowIso() {
  return new Date().toISOString();
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

  async listAdminAlbums() {
    return (await this.listAlbums())
      .filter((album) => album.del === 0)
      .map((album) => ({ ...album, id: album.album_value }));
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

  async updateAlbum(id: string, input: AlbumInput) {
    const existing = [...this.albumMap.values()].find((item) => item.album_value === id);
    if (!existing) return null;
    const album = normalizeAlbum(input, existing);
    if (album.album_value !== existing.album_value) {
      this.albumMap.delete(existing.album_value);
      this.relations = new Set(
        [...this.relations].map((value) => {
          const [imageId, albumValue] = value.split("::");
          return albumValue === existing.album_value
            ? relationKey({ imageId, album_value: album.album_value })
            : value;
        }),
      );
    }
    this.albumMap.set(album.album_value, album);
    return album;
  }

  async updateAlbumShow(id: string, show: number) {
    const existing = [...this.albumMap.values()].find((item) => item.album_value === id);
    if (existing) {
      this.albumMap.set(existing.album_value, { ...existing, show, updatedAt: nowIso() });
    }
  }

  async deleteAlbum(id: string) {
    const existing = [...this.albumMap.values()].find((item) => item.album_value === id);
    if (!existing || existing.del !== 0) return false;
    this.albumMap.set(existing.album_value, { ...existing, del: 1, updatedAt: nowIso() });
    return true;
  }

  async upsertConfig(input: ConfigInput) {
    const config = normalizeConfig(input, this.configMap.get(input.config_key));
    this.configMap.set(config.config_key, config);
    return config;
  }

  async setImageAlbum(imageId: string, albumValue: string) {
    const next = new Set(
      [...this.relations].filter((value) => value.split("::")[0] !== imageId),
    );
    next.add(relationKey({ imageId, album_value: albumValue }));
    this.relations = next;
  }

  async deleteImage(id: string) {
    return (await this.deleteImages([id])) > 0;
  }

  async deleteImages(ids: string[]) {
    const idSet = new Set(ids);
    let deleted = 0;
    for (const id of idSet) {
      const existing = this.imageMap.get(id);
      if (existing && existing.del === 0) {
        this.imageMap.set(id, { ...existing, del: 1, updatedAt: nowIso() });
        deleted += 1;
      }
    }
    this.relations = new Set(
      [...this.relations].filter((value) => !idSet.has(value.split("::")[0])),
    );
    return deleted;
  }

  private relationValues(): BackupImageAlbumRelationRecord[] {
    return [...this.relations].map((value) => {
      const [imageId, album_value] = value.split("::");
      return { imageId, album_value };
    });
  }

  async listImageRelations() {
    return this.relationValues();
  }

  async listAdminImages(query?: AdminImageQuery) {
    const [images, albums] = await Promise.all([this.listImages(), this.listAlbums()]);
    return createAdminImagePage(images, albums, this.relationValues(), query);
  }

  async listPublicAlbums() {
    return findPublicAlbums(await this.listAlbums());
  }

  async listPublicImages(query?: Parameters<PicImpactStore["listPublicImages"]>[0]) {
    const [images, albums] = await Promise.all([this.listImages(), this.listAlbums()]);
    return createPublicImagePage(images, albums, this.relationValues(), query);
  }

  async getPublicImage(id: string) {
    const [images, albums] = await Promise.all([this.listImages(), this.listAlbums()]);
    const relations = this.relationValues();
    const image = images.find((item) => item.id === id && item.del === 0 && item.show === 0);
    if (!image) return null;
    return buildPublicImage(image, imageAlbumFor(id, albums, relations));
  }

  async getPublicImageNeighbors(id: string, album = "/") {
    const [images, albums] = await Promise.all([this.listImages(), this.listAlbums()]);
    return createPublicImageNeighbors(images, albums, this.relationValues(), id, album);
  }

  async getDashboard() {
    const [images, albums] = await Promise.all([this.listImages(), this.listAlbums()]);
    return createDashboardData(images, albums, this.relationValues());
  }

  async exportSnapshot(): Promise<BackupPayloadV1> {
    return {
      configs: await this.listConfigs(),
      albums: await this.listAlbums(),
      images: await this.listImages(),
      imageAlbumRelations: this.relationValues(),
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
    } satisfies BackupImportResult["entities"];
  }
}
