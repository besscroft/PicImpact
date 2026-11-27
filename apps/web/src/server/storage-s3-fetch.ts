import type { ObjectStorage, StoragePutInput, StoredObject } from "./storage";
import { encodePath, StorageWriteDeniedError } from "./storage";
import type { S3StorageOptions } from "./storage-s3-types";

export class S3FetchObjectStorage implements ObjectStorage {
  constructor(private readonly options: S3StorageOptions) {}

  async put(input: StoragePutInput) {
    const body = input.body instanceof Uint8Array ? input.body : new Uint8Array(input.body);
    const response = await this.request("PUT", input.key, body, input.contentType);
    if (response.status === 401 || response.status === 403) {
      throw new StorageWriteDeniedError();
    }
    if (!response.ok) {
      throw new Error(`S3 upload failed with status ${response.status}`);
    }
  }

  async get(key: string): Promise<StoredObject | null> {
    const response = await this.request("GET", key);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`S3 read failed with status ${response.status}`);
    }
    return {
      body: new Uint8Array(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") ?? "application/octet-stream",
    };
  }

  url(key: string, requestOrigin: string) {
    return this.options.publicUrl
      ? `${this.options.publicUrl.replace(/\/+$/, "")}/${encodePath(key)}`
      : `${requestOrigin}/api/storage/${encodePath(key)}`;
  }

  async presignedGetUrl(key: string, expiresIn = 3600) {
    const endpoint = this.objectUrl(key);
    const amzDate = toAmzDate(new Date());
    const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/${this.options.region}/s3/aws4_request`;

    const query = [
      ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
      ["X-Amz-Credential", `${this.options.accessKeyId}/${credentialScope}`],
      ["X-Amz-Date", amzDate],
      ["X-Amz-Expires", String(expiresIn)],
      ["X-Amz-SignedHeaders", "host"],
    ] as const;
    const canonicalQuery = query
      .map(([name, value]) => `${encodeSegment(name)}=${encodeSegment(value)}`)
      .sort()
      .join("&");

    const canonicalRequest = [
      "GET",
      endpoint.pathname,
      canonicalQuery,
      `host:${endpoint.host}\n`,
      "host",
      "UNSIGNED-PAYLOAD",
    ].join("\n");
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      await sha256Hex(canonicalRequest),
    ].join("\n");
    const signingKey = await deriveSigningKey(
      this.options.secretAccessKey,
      dateStamp,
      this.options.region,
    );
    const signature = toHex(await hmac(signingKey, stringToSign));

    return `${endpoint.origin}${endpoint.pathname}?${canonicalQuery}&X-Amz-Signature=${encodeSegment(signature)}`;
  }

  private objectUrl(key: string) {
    const endpoint = new URL(
      this.options.endpoint ?? `https://s3.${this.options.region}.${this.options.region.startsWith("cn-") ? "amazonaws.com.cn" : "amazonaws.com"}`,
    );
    const { bucket } = this.options;
    const pathStyle = this.options.forcePathStyle ?? Boolean(this.options.endpoint);
    const virtualHost = !pathStyle && /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket) &&
      !endpoint.hostname.startsWith("[") && !/^\d+\.\d+\.\d+\.\d+$/.test(endpoint.hostname);
    if (virtualHost) endpoint.hostname = `${bucket}.${endpoint.hostname}`;
    const bucketPath = virtualHost ? "" : `/${encodeSegment(bucket)}`;
    endpoint.pathname = `${trimSlash(endpoint.pathname)}${bucketPath}/${key.split("/").map(encodeSegment).join("/")}`;
    return endpoint;
  }

  private async request(
    method: "GET" | "PUT",
    key: string,
    body?: Uint8Array,
    contentType?: string,
  ) {
    const endpoint = this.objectUrl(key);

    const payload = body ?? new Uint8Array();
    const payloadHash = await sha256Hex(payload);
    const amzDate = toAmzDate(new Date());
    const dateStamp = amzDate.slice(0, 8);
    const canonicalHeaderValues: Record<string, string> = {
      host: endpoint.host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    };
    if (contentType) canonicalHeaderValues["content-type"] = contentType;

    const signedHeaders = Object.keys(canonicalHeaderValues).sort().join(";");
    const canonicalHeaders = Object.keys(canonicalHeaderValues)
      .sort()
      .map((name) => `${name}:${canonicalHeaderValues[name].trim()}\n`)
      .join("");
    const canonicalRequest = [
      method,
      endpoint.pathname,
      endpoint.search.slice(1),
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");
    const credentialScope = `${dateStamp}/${this.options.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      await sha256Hex(canonicalRequest),
    ].join("\n");
    const signingKey = await deriveSigningKey(
      this.options.secretAccessKey,
      dateStamp,
      this.options.region,
    );
    const signature = toHex(await hmac(signingKey, stringToSign));
    const authorization = "AWS4-HMAC-SHA256 " + [
      `Credential=${this.options.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(", ");
    const headers = new Headers({
      Authorization: authorization,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    });
    if (contentType) headers.set("content-type", contentType);

    const requestInit: RequestInit = {
      method,
      headers,
    };
    if (method === "PUT") {
      requestInit.body = payload as unknown as BodyInit;
    }
    return fetch(endpoint, requestInit);
  }
}

async function deriveSigningKey(secret: string, date: string, region: string) {
  const dateKey = await hmac(`AWS4${secret}`, date);
  const regionKey = await hmac(dateKey, region);
  const serviceKey = await hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

async function sha256Hex(value: string | Uint8Array) {
  const data = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const bytes = new Uint8Array(data);
  return toHex(await crypto.subtle.digest("SHA-256", bytes.buffer as ArrayBuffer));
}

async function hmac(key: string | ArrayBuffer, value: string) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    typeof key === "string" ? new TextEncoder().encode(key) : key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value));
}

function toHex(value: ArrayBuffer) {
  return [...new Uint8Array(value)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function encodeSegment(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function trimSlash(value: string) {
  return value.replace(/\/+$/, "");
}
