# Multi-replica deployment

PicImpact can run as multiple replicas behind a load balancer (e.g. several Node
containers or a Kubernetes Deployment with `replicas > 1`). Most state is already
shared and safe across replicas:

- **Sessions** are persisted in PostgreSQL (better-auth Prisma adapter), so login
  state is consistent across replicas.
- **The image-preprocessing task queue** is claimed with a PostgreSQL advisory
  lock + a database lease, so two replicas (or a replica and an external cron)
  can never process the same task run concurrently.

A few per-instance concerns need configuration when you scale past one replica.

## 1. Background preprocess ticker — run a single driver

Each replica starts the background preprocess ticker by default in production
(`NODE_ENV=production`). The advisory lock means N replicas will not double-process
work, but they will all poll every ~10s, so N−1 replicas just contend for the lock
and waste CPU.

Recommended for multi-replica: disable the in-process ticker on every replica and
drive the queue with a single external scheduler.

```bash
# On every replica:
PREPROCESS_TICKER_ENABLED=false
```

Then have one external cron (Kubernetes CronJob, systemd timer, etc.) hit the tick
endpoint every 10–60s:

```bash
curl -X POST https://your-host/api/v1/preprocess-tasks/tick
```

Since this endpoint can be reached publicly, you can optionally protect it with a
shared secret. Set `PREPROCESS_TICK_SECRET` and the cron must send it in the
`x-preprocess-tick-secret` header; calls without a matching secret get `401`:

```bash
curl -X POST https://your-host/api/v1/preprocess-tasks/tick \
  -H "x-preprocess-tick-secret: $PREPROCESS_TICK_SECRET"
```

When `PREPROCESS_TICK_SECRET` is unset the endpoint stays open (so single-instance
and internal-ticker deployments are unaffected).

> Note: `/api/v1/*` admin endpoints currently rely on client-side auth checks
> only (server-side enforcement is a separate, tracked hardening item), so the
> tick secret is the one explicit server-side gate added here for the public cron
> path. If you expose the app publicly, also restrict the admin API at the
> network layer until server-side auth lands.

Alternatively, enable the ticker on exactly one replica (e.g. a dedicated worker
pod) and set `PREPROCESS_TICKER_ENABLED=false` on the rest.

> `PREPROCESS_TICKER_ENABLED` is also useful on serverless, where there is no
> long-lived process to run the ticker — disable it and use the external cron.

## 2. Database connections

Each replica opens its own Prisma connection pool. With N replicas the total
connection count is roughly `N × pool_size`. Make sure your PostgreSQL
`max_connections` covers that, or put a pooler such as PgBouncer (transaction
mode) in front of the database.

## 3. Session revocation latency

Sessions are stored in the database and shared across replicas, but better-auth
keeps a short-lived signed **cookie cache** in each instance's memory. The cache
TTL is 60s, so a sign-out or session revocation propagates to every replica
within ~60s. Lower it further in `server/auth/index.ts` (`session.cookieCache.maxAge`)
if you need faster propagation.

## 4. Public data cache (shared across replicas)

The public read paths (gallery listings, album nav, public config) are cached
with Next.js' Data Cache (`unstable_cache` in `server/lib/cache.ts`) and
invalidated on admin writes via `revalidateTag`. To make that invalidation work
across replicas, the Data Cache is routed through a PostgreSQL-backed cache
handler (`server/lib/pg-cache-handler.cjs`, wired in `next.config.mjs`):

- Cached values and per-tag invalidation timestamps live in Postgres
  (`next_cache_entries` / `next_cache_tags`, created automatically), shared by all
  replicas. Each replica also keeps a small bounded in-memory L1 for hot reads.
- An admin write calls `revalidateTag` on one replica, which records the
  invalidation in Postgres and broadcasts it via `LISTEN/NOTIFY`; every replica's
  next read of an affected entry recomputes — so admin changes are visible across
  all replicas effectively immediately.
- The tag state is **Postgres-authoritative**: each replica refreshes it from
  Postgres on a short interval and on (re)connect, so a missed `NOTIFY` (e.g. a
  replica restart, or a connection behind a transaction-mode pooler that can't
  `LISTEN`) self-heals within ~1s rather than requiring a restart.
- The per-entry safety-net TTLs still apply (gallery ~60s, album/config ~1h) as a
  backstop and to bound the background preprocess ticker's `variants_ready` gap.

Relevant environment:

- The handler uses `DATABASE_URL` for reads/writes and `DIRECT_URL` (when set) for
  the `LISTEN` connection, since `LISTEN` needs a persistent session that a
  transaction-mode pooler would drop. If only `DATABASE_URL` is set and it points
  at such a pooler, instant `NOTIFY` is skipped and propagation falls back to the
  ~1s Postgres refresh — still correct, just not instant.
- Set `CACHE_HANDLER_DEBUG=true` to log handler get/set/invalidation activity.

The long-unused-entry sweep is driven by the same single cron as the tick
endpoint (§1), so it does not run as a per-replica timer.

## 5. In-flight task cancellation

Cancelling a running preprocess/metadata task signals the replica that owns the
run. If the cancel request lands on a different replica, it is still recorded, and
the running replica stops at the next lease checkpoint (within the lease window).
For rare admin actions this lag is acceptable; a fully cross-replica cancel signal
is a planned follow-up.
