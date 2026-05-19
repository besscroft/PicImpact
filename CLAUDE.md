# PicImpact

Self-deployable photography portfolio website built with Next.js 16 + Hono.js + PostgreSQL.

## Quick Reference

```bash
# Development
pnpm run dev:server          # Start dev server
pnpm run dev:turbopack       # Dev with Turbopack

# Build
pnpm run build               # Production build
pnpm run build:vercel        # Vercel deployment build
pnpm run build:node          # Node.js deployment build

# Database
pnpm run prisma:generate     # Generate Prisma client
pnpm run prisma:dev          # Run dev migrations
pnpm run prisma:deploy       # Deploy migrations
pnpm run prisma:seed         # Seed initial data

# Linting
pnpm run lint                # ESLint check
pnpm run lint:fix            # Auto-fix lint issues
```

## Tech Stack

- **Framework:** Next.js 16 + React 19 + TypeScript (strict mode)
- **Backend API:** Hono.js (routes in `hono/`)
- **Database:** PostgreSQL + Prisma ORM (`prisma/schema.prisma`)
- **Auth:** better-auth (email/password, TOTP 2FA, WebAuthn Passkeys)
- **Styling:** Tailwind CSS v4 + Radix UI + shadcn/ui
- **State:** Zustand + SWR
- **i18n:** next-intl (zh, en, ja, zh-TW)
- **Storage:** AWS S3 / Cloudflare R2 / Open List API

## Project Structure

```
app/                    # Next.js app router
  (default)/            # Public gallery routes
  admin/                # Admin dashboard
  api/                  # API routes (auth + Hono)
  login/ sign-up/       # Auth pages
components/             # React components (admin/, gallery/, ui/, etc.)
hono/                   # Hono API route handlers
  open/                 # Public API endpoints
  storage/              # Storage-specific endpoints
server/                 # Server-side code
  auth/                 # better-auth config
  db/query/             # Database read queries
  db/operate/           # Database write operations
  lib/                  # Utilities (db client, S3, R2, uploads)
stores/                 # Zustand stores
hooks/                  # React hooks
types/                  # TypeScript type definitions
messages/               # i18n translation JSON files
prisma/                 # Schema, migrations, seed
style/                  # Global CSS
```

## Code Conventions

- **Quotes:** Single quotes (enforced by ESLint)
- **Semicolons:** Never (enforced by ESLint)
- **`any`:** Warned, avoid where possible
- **Path alias:** `~/` maps to project root
- **Components:** PascalCase filenames
- **Pages/routes:** lowercase (Next.js convention)
- **No unused variables/parameters** (TypeScript strict)

## Architecture Notes

- **Database queries:** Read operations in `server/db/query/`, write operations in `server/db/operate/`. Prisma singleton in `server/lib/db.ts`.
- **Server actions:** Shared Next.js server actions in `server/actions/`. Used by page components to deduplicate data fetching.
- **Auth:** better-auth with sessions stored in DB, cookie-based with 7-day duration. Protected routes require auth middleware.
- **Images:** Support EXIF extraction, thumbhash generation, Live Photos, WebGL viewer, map clustering via Supercluster.
- **Deployment:** Docker (multi-arch), Vercel, or bare Node.js. `script.sh` handles Docker startup (migrate + seed + start).

## API Design Specification

### Routing Structure

```
/api/auth/[...all]     → better-auth (login, signup, 2FA, passkeys)
/api/v1/*              → Protected endpoints (require auth session)
/api/public/*          → Public endpoints (no auth required)
```

All `/api/v1/*` and `/api/public/*` routes are handled by Hono via `app/api/[[...route]]/route.ts`.

### Response Format (Target Standard)

All API responses MUST follow this envelope format:

```typescript
// Success response
{
  code: 200,
  message: 'Success',
  data?: T              // Present for GET requests
}

// Error response
{
  code: number,         // HTTP status code (400, 404, 500, etc.)
  message: string       // Human-readable error description
}
```

**Rules:**
- GET endpoints: return `{ code: 200, message: 'Success', data: <result> }`
- Mutation endpoints (POST/PUT/DELETE): return `{ code: 200, message: 'Success' }`
- Errors: throw via helpers in `hono/_lib/errors.ts` (`badRequest`, `notFound`, `conflict`, `serverError`); the global `onError` in `hono/index.ts` shapes the response into the envelope.
- Binary endpoints (image blob, file download): return raw binary with appropriate Content-Type header.

### API Helpers (`hono/_lib/`)

Use these in every Hono handler instead of writing `c.json(...)` by hand:

```ts
import { ok, okEmpty } from '~/hono/_lib/response'
import { badRequest, notFound, conflict, serverError } from '~/hono/_lib/errors'

app.get('/things', async (c) => {
  const data = await fetchThings()
  return ok(c, data)                       // { code: 200, message: 'Success', data }
})

app.put('/things', async (c) => {
  await updateThing(await c.req.json())
  return okEmpty(c)                        // { code: 200, message: 'Success' }
})

app.post('/things', async (c) => {
  const body = await c.req.json()
  if (!body.name) throw badRequest('name is required')
  // ...
})
```

The `sessionMiddleware` in `hono/_lib/context.ts` is mounted on the `/api/v1` chain;
handlers can read `c.get('session')` to access the better-auth session (or `null`
when unauthenticated). `requireAuth` is exported but **not yet mounted** — opt-in
per module is tracked in the API refactor plan.

### URL Naming Convention

- **All paths use kebab-case:** `/api/v1/images/update-show` (not `updateShow` or `update-Album`)
- **Resource-oriented:** `/<module>/<resource>` or `/<module>/<resource>/:id`
- **No verb prefixes on GET:** `/api/v1/albums` not `/api/v1/albums/get`
- **Action verbs only for non-CRUD operations:** `/api/v1/daily/refresh`

### HTTP Method Semantics

| Method | Usage | Idempotent |
|--------|-------|------------|
| GET | Read data, no side effects | Yes |
| POST | Create resource or trigger action | No |
| PUT | Update existing resource | Yes |
| DELETE | Remove resource | Yes |

**Rules:**
- Never use POST for read-only operations
- GET endpoints accept query parameters, not request bodies
- PUT endpoints accept JSON body with the fields to update

### Request Body Convention

- **All request bodies use camelCase keys:** `{ dailyEnabled, albumValue }` (not `daily_enabled` or `album_value`)
- Database column names (snake_case) are mapped in the server layer, not exposed to the API consumer

### Module Reference

#### Settings (`/api/v1/settings/`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/settings/custom-info` | Fetch display settings (title, favicon, author, etc.) |
| PUT | `/settings/custom-info` | Update display settings |
| GET | `/settings/s3-info` | Fetch S3 storage config |
| PUT | `/settings/s3-info` | Update S3 storage config |
| GET | `/settings/r2-info` | Fetch R2 storage config |
| PUT | `/settings/r2-info` | Update R2 storage config |
| GET | `/settings/open-list-info` | Fetch Open List config |
| PUT | `/settings/open-list-info` | Update Open List config |
| GET | `/settings/admin-config` | Fetch admin-specific settings |

#### Images (`/api/v1/images/`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/images` | Add new image |
| PUT | `/images` | Update image metadata |
| DELETE | `/images/:id` | Delete single image |
| DELETE | `/images/batch-delete` | Batch delete images |
| PUT | `/images/update-show` | Toggle image visibility |
| PUT | `/images/update-album` | Change image album binding |
| GET | `/images/camera-lens-list` | List camera/lens models (admin) |

#### Albums (`/api/v1/albums/`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/albums` | List all albums |
| POST | `/albums` | Create album |
| PUT | `/albums` | Update album |
| DELETE | `/albums/:id` | Delete album |
| PUT | `/albums/update-show` | Toggle album visibility |

#### Daily Homepage (`/api/v1/daily/`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/daily/config` | Fetch daily homepage settings |
| PUT | `/daily/config` | Update daily homepage settings |
| GET | `/daily/albums` | List albums with daily weights |
| PUT | `/daily/albums` | Batch update album weights |
| POST | `/daily/refresh` | Trigger manual refresh |

#### Files (`/api/v1/file/`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/file/presigned-url` | Generate upload presigned URL |
| POST | `/file/upload` | Upload file via FormData |
| POST | `/file/object-url` | Get public URL for stored object |

#### Storage (`/api/v1/storage/`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/storage/open-list/info` | Fetch Open List connection info |
| GET | `/storage/open-list/storages` | List available Open List storages |

#### Public Endpoints (`/api/public/`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/public/images/image-by-id` | Fetch image metadata by ID |
| GET | `/public/download/:id` | Download image file |
| GET | `/public/camera-lens` | List camera/lens models (public, filtered to visible albums) |

### Known Deviations from Target Standard

Tracked in `docs/plans/2026-05-19-api-refactor-design.md`. Snapshot:

1. **snake_case data model leak** — `Config.config_key/config_value`, `Album.album_value`, `Image.image_name`, `image_sorting`, `show_on_mainpage`, `Exif.data_time` are exposed in API responses and request bodies. Server-side mapping layer pending. (PR-07, PR-08, PR-09.)
2. **`/api/public/download/:id` dual return type** — Returns binary blob OR `{ url, filename }` JSON depending on direct-download config. To be split into `/download/:id` (binary) and `/download/:id/presigned` (JSON envelope). (PR-01.)
3. ~~`/api/public/images/image-blob` SSRF~~ — **DONE (PR-02):** Endpoint deleted. No in-repo consumers existed.
4. ~~`/api/v1/images/camera-lens-list` & `/api/public/camera-lens-list`~~ — **DONE (PR-04):** Both endpoints consolidated under Hono. Public moved to `GET /api/public/camera-lens` and reuses `fetchClientCameraAndLensList` / `fetchDailyCameraAndLensList`, which filter to `show=0` (visible) images and, for album-scoped requests, `albums.show=0` as well. Admin remains at `GET /api/v1/images/camera-lens-list` and returns the unfiltered set.
5. **Settings PUT body shape** — `/settings/{r2,s3,open-list}-info` PUT accepts `Config[]` array with snake_case `config_key/config_value` instead of a flat camelCase object. (PR-07.)
6. **Per-handler auth & admin layout server check** — `/api/v1/*` auth is enforced only in `proxy.ts` middleware; no defense-in-depth. `app/admin/layout.tsx` has no server-side session check. (PR-10.)
7. **Tasks advisory lock scope** — `kickMetadataTaskRun` holds `withTaskLock` across the entire 10-image batch (~200s worst case). (PR-05.)

## Environment Variables

Key variables (see `.env.example` for full list):

- `DATABASE_URL` / `DIRECT_URL` — PostgreSQL connections
- `BETTER_AUTH_SECRET` — Auth secret key
- `BETTER_AUTH_URL` — App base URL
- `BETTER_AUTH_PASSKEY_RP_ID` / `BETTER_AUTH_PASSKEY_RP_NAME` — WebAuthn config

## Git Workflow

Never commit directly to main. Use feature branches (`feat/<topic>`, `fix/<topic>`) and PRs.
