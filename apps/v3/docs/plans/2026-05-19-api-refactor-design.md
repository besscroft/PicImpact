# API & Architecture Refactor — Design

**Date:** 2026-05-19
**Status:** Proposed
**Scope:** API spec compliance, snake_case data model cleanup, auth hardening, upload pipeline correctness

---

## Overview

A multi-issue audit (Auth/Middleware, Upload pipeline, Backup+Tasks, Type system, Public API) surfaced 18 problems clustered into 6 themes. CLAUDE.md's "Known Deviations" list is largely **out of date** — 4 of the 7 documented deviations are already fixed, but new debt has accumulated.

This plan splits remediation into **13 PRs across 4 waves**, optimized for parallel execution by independent agents with minimal file-level merge conflict.

### Audit Source Material

Five parallel Explore agents audited the codebase on 2026-05-19. Their findings are summarized below.

---

## Goals

- Standardize all API responses on the documented envelope (`{ code, message, data? }`).
- Eliminate database snake_case from the public API contract and frontend types.
- Add defense-in-depth auth (per-handler `requireAuth` middleware, server-side admin layout check).
- Close the SSRF hole on `/api/public/images/image-blob`.
- Centralize upload validation; deduplicate three near-identical upload components.
- Reduce advisory-lock scope around long-running task batches.
- Keep CLAUDE.md as the living source-of-truth — sync it with reality.

### Explicit Non-Goals (YAGNI)

- Backup format V2 versioning — defer until V2 is actually needed.
- CSRF tokens and per-user rate limiting — separate spike, requires threat model.
- Migrating better-auth `/api/auth/*` under Hono — works fine as-is.
- Renaming Prisma columns in the database — schema stays snake_case; remap at server boundary.

---

## Issue Inventory

### A. API envelope & status codes (low risk)
- A1. `/api/v1/file/{presigned-url,upload,object-url}` returns `{ code, data }` without `message`; `data` shape inconsistent (string vs object).
- A2. `hono/images.ts` lines 27/30/32/74/78/80 and `hono/file.ts:144` throw HTTP 500 for client-input validation errors that should be 400.
- A3. `hono/backup.ts` `/export` returns raw JSON via `c.body()`, bypassing the envelope.
- A4. `hono/tasks.ts:105` returns HTTP 201 with `code: 200` in the body — contradictory.
- A5. CLAUDE.md "Known Deviations" entries 1–5 are already fixed but still documented.

### B. Public API correctness & security (mixed risk)
- B1. **SSRF**: `/api/public/images/image-blob` (`hono/open/images.ts:8-20`) accepts arbitrary `imageUrl` and fetches server-side with no allowlist or private-IP check.
- B2. `/api/public/download/:id` returns binary blob OR JSON `{ url, filename }` depending on direct-download config — same endpoint, two contracts.
- B3. `/api/public/camera-lens-list` (Next route handler) and `/api/v1/images/camera-lens-list` (Next route handler) duplicate logic; public variant lacks album filtering.
- B4. No `Cache-Control` headers on public endpoints, RSS feed, or sitemap.
- B5. Next.js route handlers under `app/api/{public,v1}/.../route.ts` for camera-lens-list inconsistent with Hono pattern used elsewhere.

### C. snake_case data model leak (large blast radius)
- C1. `Config.config_key` / `config_value` appear in ~42 files (all layouts, admin settings, gallery themes).
- C2. `ExifType.data_time` appears in 8 files; isolated, easiest to migrate.
- C3. `Album.album_value`, `Image.image_name`, `image_sorting`, `show_on_mainpage` appear in ~25–30 files combined.
- C4. Settings PUT endpoints (`/r2-info`, `/s3-info`, `/open-list-info`) accept `Config[]` array bodies with snake_case keys instead of camelCase objects.

### D. Auth architecture (high risk)
- D1. `/api/v1/*` auth is enforced **only** in `proxy.ts` middleware. Hono handlers never re-check the session. If the middleware matcher breaks, endpoints are open.
- D2. `app/admin/layout.tsx` has no server-side auth check — the layout renders before the proxy redirect resolves; UI structure leaks on direct hits.
- D3. better-auth session is not propagated into Hono context (`c.set('session', ...)`), so handlers can't do user-scoped logic or audit logging.

### E. Upload pipeline (medium risk)
- E1. No file-size limit, MIME validation, or filename path-traversal check (`hono/file.ts`, `server/lib/file-upload.ts`).
- E2. Three upload components (`simple-file-upload.tsx`, `livephoto-file-upload.tsx`, `multiple-file-upload.tsx`) duplicate ~80% of upload/EXIF/HEIC logic.
- E3. `openListUpload` returns `undefined` on success instead of throwing; caller can't distinguish success from silent failure.

### F. Tasks correctness (high risk)
- F1. `kickMetadataTaskRun` (`server/tasks/service.ts:661-738`) holds the advisory lock for the entire 10-image batch including ~20s-per-image fetch timeouts → lock held ~200s worst case, blocking concurrent lease attempts.

---

## PR Plan

### Wave 0 — Foundation (1 PR, blocks all others)

#### PR-00 ｜ `chore(api): foundation refactor — helpers, session context, doc sync`

**Touches every `hono/*.ts` once so subsequent PRs don't need to.** Heavy by design.

**Changes:**
1. New `hono/_lib/response.ts`:
   ```ts
   export const ok = <T>(c, data?: T) =>
     c.json({ code: 200, message: 'Success', data })
   export const okEmpty = (c) =>
     c.json({ code: 200, message: 'Success' })
   ```
2. New `hono/_lib/errors.ts`: `BadRequestError`, `NotFoundError`, `ConflictError` wrapping `HTTPException`. Updated `onError` in `hono/index.ts`.
3. New `hono/_lib/context.ts`: in `app/api/[[...route]]/route.ts`, parse better-auth session once and `c.set('session', session)`. Export a `requireAuth()` middleware **but do not mount it yet** — PR-10 opts in per module.
4. Mechanical replacement across all `hono/*.ts`: every `c.json({ code: 200, ... })` → `ok(c, ...)` / `okEmpty(c)`. Fills in the missing `message` field everywhere.
5. Same pass fixes A4 (tasks POST `/runs` 201/200 conflict) by either returning 201 with `code: 201` or 200 — pick one.
6. CLAUDE.md sync: delete already-fixed deviations 1–5; replace with the inventory above; add `## API Helpers` section explaining `ok`/`okEmpty` convention.

**Files:** `hono/_lib/{response,errors,context}.ts` (new); `hono/index.ts`; `app/api/[[...route]]/route.ts`; `hono/{settings,images,albums,daily,file,tasks,backup,storage/open-list,open/download,open/images}.ts`; `CLAUDE.md`.

**Risk:** Medium — large mechanical diff. Mitigation: smoke-test admin panel + gallery + single upload locally before merge.

**Validation:**
- `pnpm run lint` clean.
- `pnpm run build` succeeds.
- Manual: log in to admin, browse gallery, upload one image, edit one album.

**Verification:** `curl /api/v1/albums` and `/api/v1/settings/custom-info` both return `{ code: 200, message: 'Success', data: [...] }`.

---

### Wave 1 — Leaf PRs (6 PRs, fully parallel after PR-00)

File sets are disjoint; agents can grab any task in any order.

#### PR-01 ｜ `feat(api): split public/download into binary vs presigned endpoints`

Split `/api/public/download/:id` into two endpoints with single contracts:
- `GET /api/public/download/:id` → always binary blob with `Content-Disposition`.
- `GET /api/public/download/:id/presigned` → always JSON `{ code, data: { url, filename } }`.

Frontend (`components/album/preview-image.tsx`) picks endpoint by `direct-download` config flag fetched alongside other settings, not by inferring from response shape.

**Files:** `hono/open/download.ts`; `components/album/preview-image.tsx`. **Risk:** Medium.

#### PR-02 ｜ `fix(security): remove image-blob SSRF surface`

**Recommended:** delete `GET /api/public/images/image-blob` entirely — `grep` shows no frontend consumer. If the route must be kept, add a host allowlist sourced from configured S3/R2/Open List endpoints and reject everything else.

**Files:** `hono/open/images.ts`. **Risk:** High (public contract change). Validate by deploying to a preview env and watching access logs for 404s on the old path.

#### PR-03 ｜ `chore(seo): add Cache-Control to RSS & sitemap`

Add `Cache-Control: public, max-age=3600` to `/rss.xml` and `/sitemap.xml`. Trivial.

**Files:** `app/rss.xml/route.ts`; `app/sitemap.ts` if present. **Risk:** Low.

#### PR-04 ｜ `refactor(api): consolidate camera-lens-list under Hono`

- Delete `app/api/public/camera-lens-list/route.ts` and `app/api/v1/images/camera-lens-list/route.ts`.
- New `hono/open/camera-lens.ts` with two endpoints: public version returns filtered set (only albums where `show=true`); protected version returns full set.
- Mount under `route.route('/open/camera-lens', cameraLens)` and `route.route('/images/camera-lens', cameraLens)` as appropriate.

**Files:** delete 2 route handlers; new `hono/open/camera-lens.ts`; update `hono/index.ts`; update consumers in `components/album/camera-lens-filter.tsx` and `components/admin/list/list-props.tsx`. **Risk:** Medium.

#### PR-05 ｜ `fix(tasks): reduce advisory lock scope around batch processing`

Refactor `server/tasks/service.ts:661-738` so `withTaskLock()` only wraps state transitions (lease acquisition, status update), not the image-fetch loop. Batch fetches happen outside the lock; results are committed under a fresh short-lived lock acquisition.

Add a logger.warn when `withTaskLock` returns null so silent failures become visible.

**Files:** `server/tasks/service.ts`. **Risk:** High (concurrency). Validation: integration test that runs two concurrent kicks and verifies neither stalls > 30s.

#### PR-06 ｜ `feat(upload): server-side validation — size, MIME, path traversal`

- Max upload size from `max_upload_size` config (new) or hardcoded 50MB initially.
- MIME allowlist: `image/*` plus configured Live Photo formats.
- Filename sanitization: reject `..`, leading `/`, NUL bytes; run `path.basename`.
- Update `hono/file.ts` `/presigned-url` and `/upload` to validate before any S3/R2 call.
- Use new `BadRequestError` from PR-00.

**Files:** `hono/file.ts`; `server/lib/file-upload.ts`. **Risk:** Medium.

---

### Wave 2A — snake_case independent (2 PRs, parallel)

Both touch `types/index.ts` but **different type names**; Git merge will likely auto-resolve, and PR-09 in Wave 2B rebases last.

#### PR-07 ｜ `refactor(api): configs key/value camelCase + settings PUT camelCase body`

**Two coupled changes, bundled because both touch `hono/settings.ts`:**

1. Response shape: `/settings/{custom,r2,s3,open-list,admin-config}-info` and `/daily/config` return `data: { customTitle, customAuthor, ... }` (flat camelCase object) instead of `Config[]` array. Server-side `fetchConfigsByKeys` keeps its current return shape; transform in route handler.
2. Request shape: settings PUT endpoints accept `{ r2AccesskeyId, r2Bucket, ... }` flat camelCase object instead of `[{ config_key, config_value }, ...]`.

Migrate ~8 frontend consumers:
- `app/layout.tsx`, `app/(theme)/[...album]/layout.tsx`, `app/(theme)/map/layout.tsx`
- `app/admin/settings/preferences/page.tsx`, `app/admin/settings/daily/page.tsx`
- `components/admin/settings/storages/{r2,s3,open-list}-edit-sheet.tsx`
- `components/layout/theme/polaroid/polaroid-gallery.tsx`, `simple-gallery.tsx`
- `hooks/use-upload-config.ts`

**Files:** `hono/settings.ts`, `hono/daily.ts` (read paths); `types/index.ts` (Config type rename + new shape interfaces); ~8 frontend files. **Risk:** Medium.

#### PR-08 ｜ `refactor(types): exif.data_time → exif.dateTime`

Smallest snake_case PR; serves as warm-up.

- Rename `ExifType.data_time` → `dateTime` in `types/index.ts`.
- Update raw SQL aliases in `server/db/query/images.ts` to emit `dateTime` key.
- Update `hono/images.ts` POST validation field.
- Update `components/album/preview-image-exif.tsx`.
- Update 3 upload components where `exif.data_time` is set from EXIF parsing.

**Files:** `types/index.ts`; `hono/images.ts`; `server/db/query/images.ts`; `components/album/preview-image-exif.tsx`; `components/admin/upload/{simple,livephoto,multiple}-file-upload.tsx`. **Risk:** Low.

---

### Wave 2B — snake_case bulk rename (1 PR, after PR-08)

PR-09 depends on PR-08 because `Image` type embeds `ExifType`.

#### PR-09 ｜ `refactor(types): album_value/image_name/image_sorting/show_on_mainpage → camelCase`

Largest PR in the plan. Rename four fields across the entire stack:

- `album_value` → `albumValue`
- `image_name` → `imageName`
- `image_sorting` → `imageSorting`
- `show_on_mainpage` → `showOnMainpage`

**Strategy:** rename in `types/index.ts` first, then chase TypeScript compile errors. Server-side raw SQL queries get camelCase aliases (`SELECT album_value AS "albumValue"`) so DB schema is untouched. Prisma client field names remain snake_case internally; only the API/UI boundary changes.

**Files:**
- `types/index.ts` (`Album`, `Image`, `ImagesAlbumsRelation`)
- `server/db/query/*.ts` (~7 files with raw SQL)
- `server/db/operate/{albums,images}.ts`
- `hono/{albums,images,open/download}.ts`
- ~25 frontend files: admin upload components, album list/edit sheets, image edit/batch sheets, tasks page, RSS feed, theme galleries, preview components.

**Risk:** High (largest blast radius). Mitigation: agent should run `pnpm tsc --noEmit` after each batch of file edits to catch missed renames.

**Validation:** Full smoke test of admin (upload, list, edit, delete, batch delete, daily config), gallery (album view, image view, RSS feed, sitemap).

---

### Wave 3 — Auth + upload dedup (2 PRs, parallel)

#### PR-10 ｜ `feat(auth): admin layout server check + per-handler requireAuth`

**Must be the last touch to `hono/*.ts` to avoid rebase pain.**

1. `app/admin/layout.tsx`: convert to async server component; call better-auth `auth.api.getSession({ headers })`; redirect to `/login` if no session. Removes the client-side leak window.
2. Mount `requireAuth()` (from PR-00's `hono/_lib/context.ts`) on every `/api/v1/*` Hono sub-router: `app.use('*', requireAuth())` at top of each module file in `hono/{settings,images,albums,daily,file,tasks,backup,storage/open-list}.ts`.
3. **Do not** mount on `hono/open/*` — those are intentionally public.

**Files:** `app/admin/layout.tsx`; all `hono/*.ts` except `open/*`. **Risk:** High (regression on every admin endpoint). Validation: each protected endpoint returns 401 when called without session cookie; admin pages still load when logged in.

#### PR-11 ｜ `refactor(upload): extract useImageUpload shared hook`

Pull common logic out of the three upload components:

- EXIF extraction, HEIC conversion, presigned URL flow, error handling, progress reporting → new `hooks/use-image-upload.ts`.
- The three components become thin wrappers focused on their unique UI (single file picker / Live Photo pairing / multi-file dropzone).

**Files:** `hooks/use-image-upload.ts` (new); `components/admin/upload/{simple,livephoto,multiple}-file-upload.tsx`. **Risk:** Medium. Validation: each of the three upload modes still works end-to-end.

---

## Dependency & Scheduling Matrix

```
T0  │ PR-00 (foundation)
    │   └─ blocks everything below
    │
T1  │ ┌── PR-01 ── PR-02 ── PR-03 ── PR-04 ── PR-05 ── PR-06   (6 in parallel)
    │ │
T2  │ ├── PR-07 ── PR-08                                       (2 in parallel)
    │ │
T3  │ ├── PR-09                                                (depends on PR-08)
    │ │
T4  │ └── PR-10 ── PR-11                                       (2 in parallel)
```

**Soft-conflict files** (multiple PRs touch the same file but different lines):
- `types/index.ts` — PR-07 (Config), PR-08 (ExifType), PR-09 (Album/Image). Order PR-08 → PR-07 → PR-09 to minimize rebase.
- `hono/images.ts` — PR-08 (validation field) and PR-09 (response transform) and PR-10 (auth middleware). PR-10 last.
- Three upload components — PR-08 (EXIF field rename) and PR-11 (extract hook). PR-11 should rebase onto PR-08.

---

## Verification Strategy

Each PR includes:
- `pnpm run lint` clean.
- `pnpm tsc --noEmit` clean.
- `pnpm run build` succeeds.
- Manual smoke checklist tailored to the PR's surface.

Before merging Wave 0, the agent **must** open the dev server (`pnpm run dev:server`), log into admin, view gallery, and upload one image end-to-end. Type-checking does not verify feature correctness.

---

## Out of Scope (deferred or rejected)

| Item | Reason |
|------|--------|
| Backup format V2 versioning | Not needed until V2 actually arrives. |
| CSRF tokens on state-changing requests | Requires threat-model spike; better-auth handles same-site cookie. |
| Per-user rate limiting | Current per-server limit (100/10s) is fine for self-deploy. |
| Migrating `/api/auth/[...all]` under Hono | Works as-is; better-auth owns this surface. |
| Renaming Prisma snake_case columns in DB | Migration cost > benefit; remap at server boundary instead. |

---

## Open Questions

- **PR-02 (SSRF):** Confirm `/api/public/images/image-blob` truly has no consumer. If admin tooling uses it for thumbnail rendering, the allowlist path is mandatory.
- **PR-04 (camera-lens-list):** Should the public variant filter to currently-`show` albums only, or all albums? Audit recommends `show`-only.
- **PR-09 (snake_case bulk rename):** Should the API support a transition period (return both `album_value` and `albumValue` for one release), or hard-cut? Recommendation: hard-cut, since this is a self-deployed app with no external API consumers.
