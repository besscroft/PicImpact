import 'server-only'

import { db } from '~/server/lib/db'

// NOTE: this only sweeps `next_cache_entries`. The `next_cache_tags` table is
// intentionally not swept because the tag set is a small fixed enum
// (CACHE_TAG.gallery/albums/config in server/lib/cache.ts), so it can't grow. If
// unbounded tags are ever passed to `revalidateTag` (e.g. a per-image tag),
// next_cache_tags would need its own sweep — revisit this then.
//
// Cached keys are deterministic (unstable_cache key + args), and active entries
// are rewritten well within their TTL (gallery ≤60s, albums/config ≤1h), so the
// entries table is naturally bounded by the number of distinct queries. This
// sweep just drops rows that haven't been written for a long time — i.e. keys
// no longer in use — so the table can't accumulate dead entries indefinitely.
const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Best-effort deletion of long-unused cache entries. Driven by the same single
 * external cron that drives the preprocess tick (see docs/multi-replica.md), so
 * it does NOT run as a per-replica timer. Never throws — cache cleanup must not
 * break the caller (e.g. the tick endpoint).
 */
export async function cleanupStaleCacheEntries(): Promise<number> {
  const cutoff = Date.now() - STALE_AFTER_MS
  try {
    // Table is owned by the PG cache handler (server/lib/pg-cache-handler.cjs).
    return await db.$executeRaw`DELETE FROM next_cache_entries WHERE last_modified < ${cutoff}`
  } catch (error) {
    // Table may not exist yet (handler hasn't run) or DB hiccup — ignore.
    console.warn('Cache cleanup skipped:', error instanceof Error ? error.message : error)
    return 0
  }
}
