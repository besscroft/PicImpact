# PicImpact Web

`apps/web` is the v4 web rewrite foundation. It intentionally keeps the first
release small: photos (the v3 `images` domain), albums, configuration, and the
v3 backup bridge.

## Stack

- Solid 2 + Vite
- `@ui-sdk/solid` for accessible interaction primitives
- Hono for the runtime-neutral API
- Drizzle ORM with PostgreSQL schema compatibility
- Better Auth with the Drizzle adapter
- Motion for small browser-side transitions
- R2/S3-compatible object storage adapters for original uploads

## Run locally

```shell
pnpm install
pnpm --filter @picimpact/web dev
```

`DATABASE_URL` is required — the app always uses the Drizzle PostgreSQL store.

## PostgreSQL

```shell
pnpm --filter @picimpact/web db:generate
pnpm --filter @picimpact/web db:migrate
```

The Drizzle schema keeps the v3 table names and column names for `images`,
`albums`, `configs`, and `images_albums_relation`. Better Auth tables are
generated from Better Auth 1.7.28's current core schema: `user`, `session`,
`account`, and `verification`. v3-only `two_factor` and `passkey` tables are
not copied into the v4 baseline.

## Deploy

- Docker: build `apps/web/Dockerfile`, then run the container with
  `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`.
- Cloudflare Workers: build the client, then deploy `wrangler.toml`. The Worker
  entry uses the same Hono app and Neon-compatible PostgreSQL HTTP driver.

## Authentication

When `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` are set, the
admin modules require a Better Auth session. The UI includes email/password
sign-in and account sign-up at the same entry point.

## Uploads

- Storage settings live in the `configs` table, not environment variables.
  Configure `storage.driver` as `s3` or `r2`, then add the
  corresponding `storage.*` keys from the configuration UI/API.
- Cloudflare Workers support both the `R2` binding (`storage.driver=r2`) and
  S3-compatible endpoints (`storage.driver=s3`) through a Web Crypto SigV4
  adapter.
- Docker/Node supports the same S3-compatible endpoints with the Node S3
  adapter.
- With no storage config, uploads are disabled (the upload endpoint returns
  503) until object storage is configured.

The upload endpoint is `POST /api/photos/upload` with a multipart `file` field.
The supported storage keys are `storage.driver`, `storage.endpoint`,
`storage.region`, `storage.bucket`, `storage.access_key_id`,
`storage.secret_access_key`, `storage.public_url`, and
`storage.max_upload_bytes`.

## Backup compatibility

The API accepts the v3 `picimpact-backup` version 1 envelope:

- `POST /api/backup/import/preview`
- `POST /api/backup/import`
- `GET /api/backup/export`

Authentication records, daily materialized data, and object storage files stay
out of this contract, matching the v3 export scope.
