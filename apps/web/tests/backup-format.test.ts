import { describe, expect, it } from "vite-plus/test";

import { BackupValidationError, parseBackupEnvelope } from "../src/server/backup/format";

const validEnvelope = {
  format: "picimpact-backup",
  version: 1,
  exportedAt: "2026-11-24T00:00:00.000Z",
  source: { orm: "prisma", database: "postgresql" },
  payload: {
    configs: [
      {
        config_key: "site_title",
        config_value: "PicImpact",
        detail: null,
        createdAt: "2026-11-24T00:00:00.000Z",
        updatedAt: null,
      },
    ],
    albums: [
      {
        album_value: "travel",
        name: "Travel",
        detail: null,
        theme: "0",
        show: 1,
        sort: 0,
        random_show: 1,
        license: null,
        image_sorting: 1,
        daily_weight: 0,
        del: 0,
        createdAt: "2026-11-24T00:00:00.000Z",
        updatedAt: null,
      },
    ],
    images: [
      {
        id: "photo-1",
        image_name: "lake.jpg",
        url: "https://cdn.example.test/lake.jpg",
        preview_url: null,
        video_url: null,
        blurhash: null,
        exif: null,
        labels: ["lake"],
        width: 1600,
        height: 1000,
        lon: null,
        lat: null,
        title: null,
        detail: null,
        type: 1,
        show: 1,
        show_on_mainpage: 1,
        sort: 0,
        del: 0,
        createdAt: "2026-11-24T00:00:00.000Z",
        updatedAt: null,
      },
    ],
    imageAlbumRelations: [{ imageId: "photo-1", album_value: "travel" }],
  },
};

describe("v3 backup contract", () => {
  it("previews a valid v1 envelope with stable counts", () => {
    const result = parseBackupEnvelope(validEnvelope);

    expect(result.preview.valid).toBe(true);
    expect(result.preview.counts).toEqual({
      configs: 1,
      albums: 1,
      images: 1,
      imageAlbumRelations: 1,
    });
    expect(result.preview.scope.included).toContain("images");
  });

  it("rejects relations that point at missing records", () => {
    expect(() =>
      parseBackupEnvelope({
        ...validEnvelope,
        payload: {
          ...validEnvelope.payload,
          imageAlbumRelations: [{ imageId: "missing", album_value: "travel" }],
        },
      }),
    ).toThrow(BackupValidationError);

    try {
      parseBackupEnvelope({
        ...validEnvelope,
        payload: {
          ...validEnvelope.payload,
          imageAlbumRelations: [{ imageId: "missing", album_value: "travel" }],
        },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(BackupValidationError);
      expect((error as BackupValidationError).preview.issues[0]?.path).toContain(
        "imageAlbumRelations",
      );
    }
  });

  it("rejects unsupported versions before touching storage", () => {
    expect(() => parseBackupEnvelope({ ...validEnvelope, version: 2 })).toThrow(
      "Unsupported backup version",
    );
  });
});
