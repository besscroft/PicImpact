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

For a new database, set `DATABASE_URL` to a standard `postgresql://` connection
string in your local shell or `apps/web/.env`, then run `pnpm run web:db:migrate`
from the repository root. Use a database role that can create schemas, tables,
and indexes. The script applies the checked-in migrations over PostgreSQL; it
does not need a Cloudflare binding. Use the provider's direct or session-mode
connection for migrations. Run migrations before starting either deployment;
neither deployment creates tables at startup. `pnpm run web:db:generate` is only
needed when changing the schema.

The Drizzle schema keeps the v3 table names and column names for `images`,
`albums`, `configs`, and `images_albums_relation`. Better Auth tables are
generated from Better Auth 1.7.28's current core schema: `user`, `session`,
`account`, and `verification`. v3-only `two_factor` and `passkey` tables are
not copied into the v4 baseline.

## Deploy

### Docker

Build from the repository root with `docker build -f apps/web/Dockerfile .`.
Run the image with `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`.
The connection string must be reachable from the container; for another
container, use its service/DNS name, not `localhost`. Use the database
provider's recommended TLS options.

### Cloudflare Workers

1. Create a Cloudflare Hyperdrive configuration targeting the same PostgreSQL
   database you migrated. Use the provider's recommended origin connection
   (for Supabase, use a direct connection or its session pooler if IPv4 is
   needed). The database must be reachable by Hyperdrive; private origins
   require [private database connectivity](https://developers.cloudflare.com/hyperdrive/configuration/connect-to-private-database/).
   Disable Hyperdrive query caching for this application so authentication and
   admin reads see writes immediately.
2. Bind that configuration to the Worker as `HYPERDRIVE`. For Wrangler or
   Workers Builds, configure the `[[hyperdrive]]` block in `wrangler.toml` with
   its ID. This is the recommended mode. Alternatively, omit Hyperdrive and set
   `DATABASE_URL` as a Worker Secret to connect directly to a publicly reachable
   PostgreSQL endpoint. Set `BETTER_AUTH_URL` to your public site URL and
   `BETTER_AUTH_SECRET` to a random Worker secret. Do not put database
   credentials in `wrangler.toml`.
3. The web `build` script runs `db:migrate` before compiling, so the existing
   Cloudflare Workers Build command `pnpm --filter @picimpact/web build` now
   migrates before every deployment. The build environment must expose
   `DATABASE_URL`; a Worker runtime Secret is not automatically available to
   the build step. Alternatively, run `pnpm run web:worker:deploy` locally or
   from CI, which performs the same migration-before-build-before-deploy
   sequence. Check `/api/health` for a
   working connection and `/api/public/albums` to verify the tables are present.

`pnpm run web:dev:worker` also migrates before starting local Wrangler dev. A
successful migration is idempotent: Drizzle records the applied migration and
skips it on later deployments.

## Authentication

With the database and Better Auth configured, the admin modules require a
Better Auth session. The UI includes email/password sign-in and account sign-up
at the same entry point.

## Uploads

- Configure S3 and R2 independently under the admin sidebar's storage settings
  (存储配置), then choose the destination on the upload page.
- Both Docker/Node and Cloudflare Workers support S3-compatible endpoints and
  R2 API credentials. Workers also support an `R2` binding as a fallback when
  R2 is selected and the API credentials are incomplete.
- Uploading to an unconfigured destination returns 503.

`POST /api/photos/upload` accepts multipart `file`, `storage` (`s3` or `r2`),
and optional `preview` fields. The upload limit defaults to 25 MiB. Existing
`storage.max_upload_bytes` values are still honored. The old `storage.driver`
value remains a fallback for uploads and proxy links without a provider.

- S3: configure `storage.bucket`, `storage.access_key_id`,
  `storage.secret_access_key`, and `storage.region`. Set `storage.endpoint`
  for S3-compatible services. Set `storage.force_path_style` to `true` for
  `endpoint/bucket` or `false` for `bucket.endpoint`. If omitted, custom
  endpoints use path-style addressing, while AWS endpoints use the SDK default.
- R2: configure `storage.r2.account_id`, `storage.r2.bucket`,
  `storage.r2.access_key_id`, and `storage.r2.secret_access_key`.
  Use the Access Key ID and Secret Access Key generated by an R2 API token
  with **Object Read & Write** permission for the selected bucket. A public
  domain allows reads but does not grant write access to the S3 API.
- Set `storage.storage_folder` (S3) or `storage.r2.storage_folder` (R2) to
  prefix new object keys. Set `storage.public_url` (S3) or
  `storage.r2.public_url` (R2) to publish links on a custom domain; without one,
  the app serves the files through `/api/storage/`. A hostname without a scheme
  is treated as HTTPS.

## Backup compatibility

The API accepts the v3 `picimpact-backup` version 1 envelope:

- `POST /api/backup/import/preview`
- `POST /api/backup/import`
- `GET /api/backup/export`

Authentication records, daily materialized data, and object storage files stay
out of this contract, matching the v3 export scope.
