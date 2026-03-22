# Daily Homepage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a configurable "daily homepage" feature that auto-selects photos from weighted albums on a timer, replacing the manual `show_on_mainpage` logic when enabled.

**Architecture:** Prisma migration adds `daily_weight` to albums + creates a materialized view `daily_images`. Server-side query layer checks `daily_enabled` config and either queries the materialized view or falls back to existing logic. A lazy-refresh mechanism on homepage requests refreshes the view when the interval expires. Admin UI provides a dedicated settings page.

**Tech Stack:** Next.js 16, Hono.js, Prisma 6, PostgreSQL materialized views, shadcn/ui, SWR, next-intl

---

### Task 1: Database Migration — Albums field + Config seeds + Materialized View

**Files:**
- Modify: `prisma/schema.prisma` (add `daily_weight` field to Albums model)
- Create: `prisma/migrations/20260322000000_add_daily_homepage/migration.sql`
- Modify: `prisma/seed.ts` (add daily config entries)

**Step 1: Add `daily_weight` to Albums in Prisma schema**

In `prisma/schema.prisma`, add to the Albums model after `image_sorting`:

```prisma
  daily_weight         Int                    @default(0) @db.SmallInt
```

**Step 2: Create the migration SQL**

Create `prisma/migrations/20260322000000_add_daily_homepage/migration.sql`:

```sql
-- Add daily_weight column to albums
ALTER TABLE "albums" ADD COLUMN "daily_weight" SMALLINT NOT NULL DEFAULT 0;

-- Create materialized view for daily homepage
-- Uses weighted random selection from albums with daily_weight > 0
CREATE MATERIALIZED VIEW "daily_images" AS
WITH config AS (
  SELECT COALESCE(
    (SELECT CAST(config_value AS INTEGER) FROM "configs" WHERE config_key = 'daily_total_count'),
    30
  ) AS total_count
),
album_weights AS (
  SELECT
    a.album_value,
    a.daily_weight,
    COUNT(DISTINCT i.id) AS photo_count,
    a.daily_weight::FLOAT / SUM(a.daily_weight) OVER () AS weight_ratio
  FROM "albums" a
  INNER JOIN "images_albums_relation" iar ON a.album_value = iar.album_value
  INNER JOIN "images" i ON iar."imageId" = i.id
  WHERE a.del = 0 AND a.daily_weight > 0 AND i.del = 0 AND i.show = 0
  GROUP BY a.album_value, a.daily_weight
),
album_quotas AS (
  SELECT
    album_value,
    daily_weight,
    photo_count,
    weight_ratio,
    LEAST(
      photo_count,
      CEIL(weight_ratio * (SELECT total_count FROM config))
    )::INTEGER AS quota
  FROM album_weights
),
ranked_images AS (
  SELECT
    i.*,
    aq.quota,
    ROW_NUMBER() OVER (PARTITION BY aq.album_value ORDER BY random()) AS rn
  FROM "images" i
  INNER JOIN "images_albums_relation" iar ON i.id = iar."imageId"
  INNER JOIN album_quotas aq ON iar.album_value = aq.album_value
  WHERE i.del = 0 AND i.show = 0
)
SELECT
  id, image_name, url, preview_url, video_url, blurhash, exif, labels,
  width, height, lon, lat, title, detail, type, show, show_on_mainpage,
  sort, created_at, updated_at, del,
  ROW_NUMBER() OVER (ORDER BY random()) AS daily_sort
FROM ranked_images
WHERE rn <= quota
LIMIT (SELECT total_count FROM config);

-- Create unique index for concurrent refresh support
CREATE UNIQUE INDEX "daily_images_id_idx" ON "daily_images" (id);
```

**Step 3: Add daily config entries to seed**

In `prisma/seed.ts`, add to `INITIAL_CONFIGS` array:

```typescript
  { config_key: 'daily_enabled', config_value: 'false', detail: '是否启用 Daily 首页模式' },
  { config_key: 'daily_refresh_interval', config_value: '24', detail: 'Daily 首页刷新间隔（小时）：6/12/24/168' },
  { config_key: 'daily_total_count', config_value: '30', detail: 'Daily 首页展示照片总数' },
  { config_key: 'daily_last_refresh', config_value: '', detail: 'Daily 首页上次刷新时间' },
```

**Step 4: Generate Prisma client and verify**

Run: `pnpm run prisma:generate`
Expected: Prisma client generated successfully with new `daily_weight` field

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260322000000_add_daily_homepage/ prisma/seed.ts
git commit -m "feat(daily): add database migration for daily homepage"
```

---

### Task 2: Server-side Query Layer — Daily image queries

**Files:**
- Create: `server/db/query/daily.ts`

**Step 1: Create the daily query module**

Create `server/db/query/daily.ts`:

```typescript
'use server'

import { Prisma } from '@prisma/client'
import { db } from '~/server/lib/db'
import type { ImageType } from '~/types'
import { fetchConfigsByKeys } from './configs'

const DEFAULT_SIZE = 24

/**
 * 检查是否需要刷新 daily 视图，如果需要则刷新
 */
export async function checkAndRefreshDailyImages(): Promise<void> {
  const configs = await fetchConfigsByKeys([
    'daily_enabled',
    'daily_refresh_interval',
    'daily_last_refresh'
  ])

  const enabled = configs.find(c => c.config_key === 'daily_enabled')?.config_value === 'true'
  if (!enabled) return

  const interval = parseInt(configs.find(c => c.config_key === 'daily_refresh_interval')?.config_value || '24', 10)
  const lastRefresh = configs.find(c => c.config_key === 'daily_last_refresh')?.config_value

  const now = new Date()
  if (lastRefresh) {
    const lastRefreshDate = new Date(lastRefresh)
    const nextRefresh = new Date(lastRefreshDate.getTime() + interval * 60 * 60 * 1000)
    if (now < nextRefresh) return
  }

  await refreshDailyImages()
}

/**
 * 强制刷新 daily 物化视图
 */
export async function refreshDailyImages(): Promise<void> {
  await db.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY "daily_images"')
  await db.configs.update({
    where: { config_key: 'daily_last_refresh' },
    data: { config_value: new Date().toISOString(), updatedAt: new Date() }
  })
}

/**
 * 获取 daily 图片分页列表
 */
export async function fetchDailyImagesList(
  pageNum: number,
  camera?: string,
  lens?: string
): Promise<ImageType[]> {
  if (pageNum < 1) pageNum = 1
  return await db.$queryRaw`
    SELECT *
    FROM "daily_images"
    WHERE 1 = 1
    ${camera ? Prisma.sql`AND COALESCE(exif->>'model', 'Unknown') = ${camera}` : Prisma.empty}
    ${lens ? Prisma.sql`AND COALESCE(exif->>'lens_model', 'Unknown') = ${lens}` : Prisma.empty}
    ORDER BY daily_sort
    LIMIT ${DEFAULT_SIZE} OFFSET ${(pageNum - 1) * DEFAULT_SIZE}
  `
}

/**
 * 获取 daily 图片分页总数
 */
export async function fetchDailyImagesPageTotal(
  camera?: string,
  lens?: string
): Promise<number> {
  const pageTotal = await db.$queryRaw`
    SELECT COALESCE(COUNT(1), 0) AS total
    FROM "daily_images"
    WHERE 1 = 1
    ${camera ? Prisma.sql`AND COALESCE(exif->>'model', 'Unknown') = ${camera}` : Prisma.empty}
    ${lens ? Prisma.sql`AND COALESCE(exif->>'lens_model', 'Unknown') = ${lens}` : Prisma.empty}
  `
  // @ts-expect-error - The query result is guaranteed to have a total field
  return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / DEFAULT_SIZE) : 0
}

/**
 * 获取 daily 图片的相机和镜头列表
 */
export async function fetchDailyCameraAndLensList(): Promise<{ cameras: string[], lenses: string[] }> {
  const stats = await db.$queryRaw<Array<{ camera: string; lens: string }>>`
    SELECT DISTINCT
      COALESCE(exif->>'model', 'Unknown') as camera,
      COALESCE(exif->>'lens_model', 'Unknown') as lens
    FROM "daily_images"
    ORDER BY camera, lens
  `
  const cameras = [...new Set(stats.map(item => item.camera))]
  const lenses = [...new Set(stats.map(item => item.lens))]
  return { cameras, lenses }
}

/**
 * 获取所有相册及其权重和照片数量
 */
export async function fetchAlbumsWithDailyWeight(): Promise<any[]> {
  return await db.$queryRaw`
    SELECT
      a.id,
      a.name,
      a.album_value,
      a.daily_weight,
      COALESCE(COUNT(DISTINCT i.id), 0)::INTEGER AS photo_count
    FROM "albums" a
    LEFT JOIN "images_albums_relation" iar ON a.album_value = iar.album_value
    LEFT JOIN "images" i ON iar."imageId" = i.id AND i.del = 0 AND i.show = 0
    WHERE a.del = 0
    GROUP BY a.id, a.name, a.album_value, a.daily_weight
    ORDER BY a.sort DESC, a.created_at DESC
  `
}
```

**Step 2: Commit**

```bash
git add server/db/query/daily.ts
git commit -m "feat(daily): add server-side query layer for daily images"
```

---

### Task 3: Server-side Operate Layer — Daily config and weight updates

**Files:**
- Create: `server/db/operate/daily.ts`

**Step 1: Create the daily operate module**

Create `server/db/operate/daily.ts`:

```typescript
'use server'

import { db } from '~/server/lib/db'

/**
 * 更新 daily 配置
 */
export async function updateDailyConfig(payload: {
  dailyEnabled: boolean
  dailyRefreshInterval: string
  dailyTotalCount: number
}) {
  const { dailyEnabled, dailyRefreshInterval, dailyTotalCount } = payload
  const updates = [
    db.configs.update({
      where: { config_key: 'daily_enabled' },
      data: { config_value: dailyEnabled ? 'true' : 'false', updatedAt: new Date() }
    }),
    db.configs.update({
      where: { config_key: 'daily_refresh_interval' },
      data: { config_value: dailyRefreshInterval, updatedAt: new Date() }
    }),
    db.configs.update({
      where: { config_key: 'daily_total_count' },
      data: { config_value: dailyTotalCount.toString(), updatedAt: new Date() }
    }),
  ]
  return await db.$transaction(updates)
}

/**
 * 批量更新相册 daily 权重
 */
export async function updateAlbumsDailyWeight(
  albums: Array<{ id: string, dailyWeight: number }>
) {
  const updates = albums.map(album =>
    db.albums.update({
      where: { id: album.id },
      data: { daily_weight: album.dailyWeight, updatedAt: new Date() }
    })
  )
  return await db.$transaction(updates)
}
```

**Step 2: Commit**

```bash
git add server/db/operate/daily.ts
git commit -m "feat(daily): add server-side operate layer for daily config"
```

---

### Task 4: Hono API Routes

**Files:**
- Create: `hono/daily.ts`
- Modify: `hono/index.ts` (register new route)

**Step 1: Create the daily route handler**

Create `hono/daily.ts`:

```typescript
import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { fetchAlbumsWithDailyWeight, refreshDailyImages } from '~/server/db/query/daily'
import { updateDailyConfig, updateAlbumsDailyWeight } from '~/server/db/operate/daily'

const app = new Hono()

app.get('/config', async (c) => {
  try {
    const data = await fetchConfigsByKeys([
      'daily_enabled',
      'daily_refresh_interval',
      'daily_total_count',
      'daily_last_refresh'
    ])
    return c.json(data)
  } catch (error) {
    throw new HTTPException(500, { message: 'Failed to fetch daily config', cause: error })
  }
})

app.put('/config', async (c) => {
  const body = await c.req.json() satisfies {
    dailyEnabled: boolean
    dailyRefreshInterval: string
    dailyTotalCount: number
  }
  try {
    await updateDailyConfig(body)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.get('/albums', async (c) => {
  try {
    const data = await fetchAlbumsWithDailyWeight()
    return c.json(data)
  } catch (error) {
    throw new HTTPException(500, { message: 'Failed to fetch albums', cause: error })
  }
})

app.put('/albums', async (c) => {
  const body = await c.req.json() as Array<{ id: string, dailyWeight: number }>
  try {
    await updateAlbumsDailyWeight(body)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.post('/refresh', async (c) => {
  try {
    await refreshDailyImages()
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to refresh', cause: e })
  }
})

export default app
```

**Step 2: Register the route in `hono/index.ts`**

Add import and route:

```typescript
import daily from '~/hono/daily'
// ...
route.route('/daily', daily)
```

**Step 3: Commit**

```bash
git add hono/daily.ts hono/index.ts
git commit -m "feat(daily): add Hono API routes for daily config and refresh"
```

---

### Task 5: i18n — Add translation keys

**Files:**
- Modify: `messages/zh.json`
- Modify: `messages/en.json`
- Modify: `messages/ja.json`
- Modify: `messages/zh-TW.json`

**Step 1: Add translation keys to all locale files**

Add to the `Link` section:
```json
"daily": "Daily 首页"
```

Add a new `Daily` section:
```json
"Daily": {
  "title": "Daily 首页设置",
  "enabled": "启用 Daily 首页",
  "enabledDescription": "开启后首页将从相册中自动选取照片展示，替代手动选择模式",
  "refreshInterval": "刷新间隔",
  "every6Hours": "每 6 小时",
  "every12Hours": "每 12 小时",
  "everyDay": "每天",
  "everyWeek": "每周",
  "totalCount": "展示照片总数",
  "lastRefresh": "上次刷新时间",
  "nextRefresh": "下次刷新时间",
  "neverRefreshed": "从未刷新",
  "manualRefresh": "立即刷新",
  "refreshSuccess": "刷新成功！",
  "refreshFailed": "刷新失败！",
  "albumWeights": "相册权重配置",
  "albumName": "相册名称",
  "photoCount": "照片数量",
  "weight": "权重",
  "estimatedQuota": "预计配额",
  "notParticipating": "不参与",
  "participating": "参与中",
  "totalParticipating": "参与相册数",
  "saveSuccess": "保存成功！",
  "saveFailed": "保存失败！"
}
```

Provide equivalent translations for `en.json`, `ja.json`, `zh-TW.json`.

**Step 2: Commit**

```bash
git add messages/
git commit -m "feat(daily): add i18n translation keys"
```

---

### Task 6: Admin Settings Page — Daily configuration UI

**Files:**
- Create: `app/admin/settings/daily/page.tsx`
- Modify: `components/layout/admin/app-sidebar.tsx` (add nav entry)

**Step 1: Create the admin page**

Create `app/admin/settings/daily/page.tsx` — a client component following the same pattern as `preferences/page.tsx`:
- SWR to fetch `/api/v1/daily/config` and `/api/v1/daily/albums`
- Form state with useState for enabled (switch), interval (select), totalCount (number input)
- Album weight table with sliders (0-10)
- Display last/next refresh time
- Manual refresh button calls `POST /api/v1/daily/refresh`
- Submit button saves both config and album weights

Key UI structure:
```
- Title bar with submit button
- Grid layout:
  - Column 1: Switch (enabled), Select (interval), Input (total count)
  - Column 2: Status (last refresh, next refresh), Manual refresh button
- Album weight table:
  - Columns: name, photo count, weight slider, estimated quota
  - Footer: summary stats
```

**Step 2: Add navigation entry**

In `components/layout/admin/app-sidebar.tsx`, add to the `projects.items` array:

```typescript
{
  name: t('Link.daily'),
  url: '/admin/settings/daily',
  icon: CalendarDaysIcon,
},
```

Create a new icon component `components/icons/calendar-days.tsx` using lucide-react's `CalendarDays` icon, following the same pattern as existing icon components.

**Step 3: Commit**

```bash
git add app/admin/settings/daily/ components/layout/admin/app-sidebar.tsx components/icons/calendar-days.tsx
git commit -m "feat(daily): add admin settings page and navigation"
```

---

### Task 7: Homepage Integration — Wire daily logic into page.tsx

**Files:**
- Modify: `app/(default)/page.tsx`
- Modify: `server/db/query/images.ts` (add daily-aware camera/lens list)

**Step 1: Modify the homepage server component**

Update `app/(default)/page.tsx` to check `daily_enabled` and branch data fetching:

```typescript
import { fetchConfigsByKeys, fetchConfigValue } from '~/server/db/query/configs'
import { checkAndRefreshDailyImages, fetchDailyImagesList, fetchDailyImagesPageTotal } from '~/server/db/query/daily'
// ... existing imports

export default async function Home() {
  const dailyEnabled = await fetchConfigValue('daily_enabled', 'false')

  if (dailyEnabled === 'true') {
    await checkAndRefreshDailyImages()
  }

  const getData = async (pageNum: number, album: string, camera?: string, lens?: string) => {
    'use server'
    const isDailyEnabled = await fetchConfigValue('daily_enabled', 'false')
    if (isDailyEnabled === 'true') {
      return await fetchDailyImagesList(pageNum, camera, lens)
    }
    return await fetchClientImagesListByAlbum(pageNum, album, camera, lens)
  }

  const getPageTotal = async (album: string, camera?: string, lens?: string) => {
    'use server'
    const isDailyEnabled = await fetchConfigValue('daily_enabled', 'false')
    if (isDailyEnabled === 'true') {
      return await fetchDailyImagesPageTotal(camera, lens)
    }
    return await fetchClientImagesPageTotalByAlbum(album, camera, lens)
  }

  // ... rest unchanged (getConfig, getStyleConfig, props, render)
}
```

**Step 2: Update camera/lens list for daily mode**

In the public camera-lens-list API (or wherever `fetchClientCameraAndLensList` is called for homepage), add daily mode awareness — when daily is enabled and album is `/`, use `fetchDailyCameraAndLensList()` instead.

Check `hono/open/` or `app/api/public/camera-lens-list/` for the endpoint that serves camera/lens data.

**Step 3: Commit**

```bash
git add app/(default)/page.tsx server/db/query/images.ts
git commit -m "feat(daily): integrate daily mode into homepage data flow"
```

---

### Task 8: Build Verification and Final Testing

**Step 1: Generate Prisma client**

Run: `pnpm run prisma:generate`
Expected: Success

**Step 2: Run lint**

Run: `pnpm run lint`
Expected: No errors related to new files

**Step 3: Run production build**

Run: `pnpm run build`
Expected: Build succeeds with all new pages and API routes

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(daily): address build issues"
```
