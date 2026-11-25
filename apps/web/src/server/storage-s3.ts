import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import type { ObjectStorage, StoragePutInput, StoredObject } from "./storage";
import { encodePath } from "./storage";
import type { S3StorageOptions } from "./storage-s3-types";

export class S3ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;

  constructor(private readonly options: S3StorageOptions) {
    this.client = new S3Client({
      endpoint: options.endpoint,
      region: options.region,
      forcePathStyle: Boolean(options.endpoint),
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async put(input: StoragePutInput) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: input.key,
        Body: input.body instanceof Uint8Array ? input.body : new Uint8Array(input.body),
        ContentLength: input.contentLength,
        ContentType: input.contentType,
      }),
    );
  }

  async get(key: string): Promise<StoredObject | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.options.bucket,
          Key: key,
        }),
      );
      if (!response.Body) return null;
      return {
        body: new Uint8Array(await response.Body.transformToByteArray()),
        contentType: response.ContentType ?? "application/octet-stream",
      };
    } catch (error) {
      if (error instanceof Error && error.name === "NoSuchKey") return null;
      throw error;
    }
  }

  url(key: string, requestOrigin: string) {
    return this.options.publicUrl
      ? `${this.options.publicUrl.replace(/\/+$/, "")}/${encodePath(key)}`
      : `${requestOrigin}/api/storage/${encodePath(key)}`;
  }
}
