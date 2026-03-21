# Daily Homepage Feature Design

## Overview

A configurable "daily homepage" feature that automatically selects photos from albums based on weights and refreshes on a configurable interval. When enabled, it replaces the current manual `show_on_mainpage` homepage logic. UI rendering (gallery themes) remains unchanged.

## Data Model Changes

### configs table (new entries)

| config_key | Example Value | Description |
|---|---|---|
| `daily_enabled` | `"true"` | Feature toggle |
| `daily_refresh_interval` | `"6"` / `"12"` / `"24"` / `"168"` | Refresh interval in hours |
| `daily_total_count` | `"30"` | Total photos per refresh cycle |
| `daily_last_refresh` | `"2026-03-22T00:00:00Z"` | Last refresh timestamp |

### Albums table (new field)

```prisma
daily_weight  Int  @default(0)
```

- `0` = not participating in daily selection
- `1-10` = weight level (higher = more photos selected)

### Materialized View: daily_images

Created via raw SQL in Prisma migration:

```sql
CREATE MATERIALIZED VIEW daily_images AS
SELECT image.*, row_number() OVER (ORDER BY random()) AS daily_sort
FROM "Images" image
JOIN "images_albums_relation" iar ON image.id = iar."imageId"
JOIN "Albums" album ON iar."albumId" = album.id
WHERE image.del = 0
  AND image.show = 0
  AND album.daily_weight > 0
ORDER BY random()
LIMIT (SELECT CAST(value AS INTEGER) FROM "Configs" WHERE config_key = 'daily_total_count');
```

Actual SQL will handle weighted allocation per album:
1. Calculate quota per album: `album_weight / total_weight * daily_total_count`
2. If an album has fewer photos than its quota, redistribute remaining slots to other albums by weight
3. Within each album, select photos randomly
4. Final result ordered by a single random sort

## Selection Logic

1. **Check if refresh needed** — compare `daily_last_refresh + daily_refresh_interval` with current time
2. **If expired** — execute `REFRESH MATERIALIZED VIEW daily_images`, update `daily_last_refresh`
3. **Quota calculation** — e.g., total=30, album A (weight 3), B (weight 2), C (weight 5) → A=9, B=6, C=15
4. **Shortfall redistribution** — if album B only has 4 photos, remaining 2 slots go to A and C proportionally
5. **Deterministic within cycle** — all users see the same photos and order until next refresh

## Background Task

- On each homepage request, check if refresh is needed (lazy refresh)
- `REFRESH MATERIALIZED VIEW daily_images` triggered when interval expires
- Manual refresh via admin API also supported
- Update `daily_last_refresh` after successful refresh

## API Endpoints (Hono)

All under `/api/v1/daily/` (auth required):

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/daily/config` | Get daily config (enabled, interval, total count, last refresh) |
| `PUT` | `/api/v1/daily/config` | Update daily config |
| `GET` | `/api/v1/daily/albums` | Get all albums with weights and photo counts |
| `PUT` | `/api/v1/daily/albums` | Batch update album weights |
| `POST` | `/api/v1/daily/refresh` | Manual refresh trigger |

## Homepage Data Flow

```
app/(default)/page.tsx — getData server action
  │
  ├─ daily_enabled = false
  │   └─ existing logic: fetchClientImagesListByAlbum('/')
  │      (filter: del=0, show=0, show_on_mainpage=0)
  │
  └─ daily_enabled = true
      ├─ check if refresh needed → REFRESH MATERIALIZED VIEW if expired
      └─ SELECT * FROM daily_images
         WHERE (camera filter) AND (lens filter)
         ORDER BY daily_sort
         LIMIT pageSize OFFSET (pageNum - 1) * pageSize
```

- `getPageTotal`: daily mode → `SELECT count(*) FROM daily_images` (with optional camera/lens filter)
- Camera/lens filtering applies on top of the materialized view
- Gallery theme components receive data in the same format — no UI changes needed

## Admin UI

New page: `/admin/settings/daily`

**Global Config Section:**
- Switch: Daily feature on/off
- Select: Refresh interval (6h / 12h / 24h / 1 week)
- Number input: Total photo count
- Status display: last refresh time, next refresh time
- Button: Manual refresh

**Album Weight Table:**
- All albums listed with columns: name, photo count, weight slider (0-10), estimated quota
- Weight 0 shown as "Not participating"
- Footer summary: participating album count, total weight, quota breakdown

Navigation: Settings menu → "Daily" entry

## File Locations

| Area | Files |
|---|---|
| Migration | `prisma/migrations/YYYYMMDD_add_daily_homepage/migration.sql` |
| DB queries | `server/db/query/daily.ts` (new) |
| DB operations | `server/db/operate/daily.ts` (new) |
| API routes | `hono/daily.ts` (new) |
| Admin page | `app/admin/settings/daily/page.tsx` (new) |
| Admin components | `components/admin/settings/daily/` (new) |
| Homepage change | `app/(default)/page.tsx` (modify getData/getPageTotal) |
| i18n | `messages/zh.json`, `messages/en.json`, etc. (add daily keys) |
