'use strict'

/**
 * Shared, cross-replica Next.js Data Cache handler backed by PostgreSQL.
 *
 * Why: PicImpact's public read path is memoised with `unstable_cache` + tag
 * invalidation (see server/lib/cache.ts). Next's default cache handler keeps
 * that data in per-instance memory, so when the app runs as multiple replicas a
 * `revalidateTag` on the replica handling an admin write does NOT reach the
 * others — they keep serving stale data until their entry's safety-net TTL
 * expires. This handler routes the Data Cache through Postgres so an
 * invalidation on one replica is seen by all of them.
 *
 * Design (validated by a 2-instance PoC + against the real build):
 *   - L2 = Postgres: `next_cache_entries` (cached values + when each was written)
 *     and `next_cache_tags` (per-tag last-invalidation time).
 *   - L1 = a bounded, MODULE-LEVEL in-memory cache. Next instantiates the
 *     handler class per request, so all shared state must live at module scope,
 *     not on the instance.
 *   - Cross-instance invalidation lever = `get()` returns null (cache miss) when
 *     any of an entry's tags was invalidated after the entry was written. Next's
 *     own in-process tag manifest can't be fed from another replica, but it only
 *     runs when `get()` returns data — so making `get()` the decision point,
 *     against the shared manifest, is what makes invalidation cross-replica.
 *   - The tag manifest is Postgres-authoritative: refreshed from PG on a short
 *     TTL (so a missed NOTIFY / a transaction-pooled connection that can't LISTEN
 *     still converges within ~1s) and busted instantly via LISTEN/NOTIFY when a
 *     direct connection is available.
 *   - Ordering uses the Postgres server clock for BOTH an entry's write time and
 *     a tag's invalidation time, so the "was this entry written before the tag
 *     was invalidated?" comparison can't be fooled by clock skew between replicas.
 *   - Consistency model = instant: any `revalidateTag` turns every entry written
 *     before it into a miss → immediate recompute on the next read, on every
 *     replica. We intentionally do not implement cross-instance
 *     stale-while-revalidate (which would let a replica serve one stale read
 *     after an admin change); instant visibility is the chosen behaviour. Per-entry
 *     safety-net TTLs (the `revalidate` seconds on each `unstable_cache`) are left
 *     to Next, which compares age against `revalidate` using the `lastModified`
 *     we return.
 */

const { Pool, Client } = require('pg')

const ENTRY_TABLE = 'next_cache_entries'
const TAG_TABLE = 'next_cache_tags'
const NOTIFY_CHANNEL = 'next_cache_tag_invalidation'
const L1_MAX_ENTRIES = 2000
// How long the in-memory tag manifest is trusted before being re-read from PG.
// Bounds cross-replica staleness when LISTEN/NOTIFY is unavailable (e.g. behind
// a transaction-mode pooler); NOTIFY keeps it instant when a direct conn works.
const MANIFEST_TTL_MS = 1000
// Postgres server clock in epoch milliseconds — one clock for all replicas.
const NOW_MS = `(EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::bigint`

const DEBUG = process.env.CACHE_HANDLER_DEBUG === 'true'
function debug(...args) {
  if (DEBUG) console.log('[pg-cache-handler]', ...args)
}

// ── Module-level shared state (one set per process) ─────────────────────────
let pool = null
let initPromise = null
const l1 = new Map() // key -> { value, tags, lastModified }
const tagManifest = new Map() // tag -> invalidatedAt (epoch ms)
let manifestLoadedAt = 0
let manifestRefreshInFlight = null

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 })
    pool.on('error', (e) => console.warn('[pg-cache-handler] pool error:', e.message))
  }
  return pool
}

async function ensureInit() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      await getPool().query(`
        CREATE TABLE IF NOT EXISTS ${ENTRY_TABLE} (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          tags TEXT[] NOT NULL DEFAULT '{}',
          last_modified BIGINT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ${TAG_TABLE} (
          tag TEXT PRIMARY KEY,
          invalidated_at BIGINT NOT NULL DEFAULT 0
        );
      `)
    } catch (e) {
      // CREATE TABLE IF NOT EXISTS can race on pg_type when replicas boot
      // together; the table still ends up created.
      if (e.code !== '23505' && e.code !== '42P07') throw e
    }
    await refreshManifest()
    startListener() // best-effort; not required for correctness
  })()
  return initPromise
}

async function refreshManifest() {
  if (manifestRefreshInFlight) return manifestRefreshInFlight
  manifestRefreshInFlight = (async () => {
    try {
      const { rows } = await getPool().query(`SELECT tag, invalidated_at FROM ${TAG_TABLE}`)
      tagManifest.clear()
      for (const r of rows) tagManifest.set(r.tag, Number(r.invalidated_at))
      manifestLoadedAt = Date.now()
      debug('manifest refreshed,', tagManifest.size, 'tags')
    } catch (e) {
      console.warn('[pg-cache-handler] manifest refresh failed:', e.message)
    } finally {
      manifestRefreshInFlight = null
    }
  })()
  return manifestRefreshInFlight
}

// Re-read the manifest from PG if our copy is older than the TTL. PG is the
// source of truth; the in-memory copy is only a short-lived cache.
async function ensureManifestFresh() {
  if (Date.now() - manifestLoadedAt > MANIFEST_TTL_MS) {
    await refreshManifest()
  }
}

// Optional instant-invalidation path. Uses DIRECT_URL when present because
// LISTEN needs a persistent session (transaction-mode poolers drop it).
function startListener() {
  const conn = process.env.DIRECT_URL || process.env.DATABASE_URL
  const connect = () => {
    let client
    try {
      client = new Client({ connectionString: conn })
    } catch {
      return
    }
    client.on('error', (e) => {
      debug('listener error, reconnecting:', e.message)
      try { client.end() } catch {}
      setTimeout(connect, 2000)
    })
    client.on('notification', (msg) => {
      try {
        const { tag, at } = JSON.parse(msg.payload)
        const prev = tagManifest.get(tag) || 0
        if (at > prev) tagManifest.set(tag, Number(at))
        debug('NOTIFY', tag, at)
      } catch {}
    })
    client
      .connect()
      .then(() => client.query(`LISTEN ${NOTIFY_CHANNEL}`))
      .then(() => refreshManifest()) // reconcile after (re)connect — catch missed NOTIFYs
      .then(() => debug('listening on', NOTIFY_CHANNEL))
      .catch((e) => {
        debug('listener connect failed (falling back to TTL refresh):', e.message)
        try { client.end() } catch {}
        setTimeout(connect, 5000)
      })
  }
  connect()
}

function l1Set(key, entry) {
  l1.delete(key)
  l1.set(key, entry)
  if (l1.size > L1_MAX_ENTRIES) l1.delete(l1.keys().next().value)
}

// True if an entry written at `lastModified` has had any of its tags invalidated
// since. PG-authoritative via the NOTIFY-warmed / TTL-refreshed manifest.
function isInvalidated(tags, lastModified) {
  for (const tag of tags) {
    const invalidatedAt = tagManifest.get(tag)
    if (invalidatedAt && invalidatedAt > lastModified) return true
  }
  return false
}

class PgCacheHandler {
  constructor(ctx) {
    // Tags revalidated within THIS request (Next-provided), for same-request
    // read-your-writes consistency.
    this.revalidatedTags = (ctx && ctx.revalidatedTags) || []
  }

  async get(key, ctx) {
    await ensureInit()
    await ensureManifestFresh()

    let entry = l1.get(key)
    if (!entry) {
      const { rows } = await getPool().query(
        `SELECT value, tags, last_modified FROM ${ENTRY_TABLE} WHERE key = $1`, [key])
      if (!rows.length) return null
      entry = { value: rows[0].value, tags: rows[0].tags || [], lastModified: Number(rows[0].last_modified) }
      l1Set(key, entry)
    }

    const ctxTags = ctx && ctx.kind === 'FETCH' ? [...(ctx.tags || []), ...(ctx.softTags || [])] : []
    const combinedTags = [...new Set([...(entry.tags || []), ...ctxTags])]

    if (combinedTags.some((t) => this.revalidatedTags.includes(t))) return null
    if (isInvalidated(combinedTags, entry.lastModified)) return null

    return { value: entry.value, lastModified: entry.lastModified }
  }

  async set(key, data, ctx) {
    await ensureInit()
    if (!data) {
      l1.delete(key)
      try { await getPool().query(`DELETE FROM ${ENTRY_TABLE} WHERE key = $1`, [key]) } catch (e) { debug('delete failed', e.message) }
      return
    }
    const tags = (ctx && ctx.tags) || (data && data.tags) || []
    try {
      // last_modified is stamped by the Postgres clock so it orders correctly
      // against tag invalidation times regardless of which replica wrote it.
      const { rows } = await getPool().query(
        `INSERT INTO ${ENTRY_TABLE} (key, value, tags, last_modified) VALUES ($1, $2, $3, ${NOW_MS})
         ON CONFLICT (key) DO UPDATE SET value = $2, tags = $3, last_modified = ${NOW_MS}
         RETURNING last_modified`,
        [key, JSON.stringify(data), tags])
      l1Set(key, { value: data, tags, lastModified: Number(rows[0].last_modified) })
    } catch (e) {
      // A non-serialisable value (e.g. a binary ISR payload, which PicImpact's
      // all-dynamic routes don't produce) shouldn't crash the request path.
      console.warn('[pg-cache-handler] set failed:', e.message)
    }
  }

  async revalidateTag(tags) {
    await ensureInit()
    tags = typeof tags === 'string' ? [tags] : tags
    if (!tags || !tags.length) return
    for (const tag of tags) {
      try {
        // invalidated_at is the Postgres clock; only ever moves forward.
        const { rows } = await getPool().query(
          `INSERT INTO ${TAG_TABLE} (tag, invalidated_at) VALUES ($1, ${NOW_MS})
           ON CONFLICT (tag) DO UPDATE SET invalidated_at = GREATEST(${TAG_TABLE}.invalidated_at, ${NOW_MS})
           RETURNING invalidated_at`,
          [tag])
        const at = Number(rows[0].invalidated_at)
        tagManifest.set(tag, at)
        await getPool().query(`SELECT pg_notify($1, $2)`, [NOTIFY_CHANNEL, JSON.stringify({ tag, at })])
      } catch (e) {
        console.warn('[pg-cache-handler] revalidateTag failed:', e.message)
      }
    }
  }

  resetRequestCache() {}
}

module.exports = PgCacheHandler
