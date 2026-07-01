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

## 4. Public data cache (current behavior)

The public read paths (gallery listings, album nav, public config) are cached
with Next.js' Data Cache and invalidated on admin writes via `revalidateTag`.
That cache is **per-replica in-memory** by default, so a `revalidateTag` call only
busts the cache on the replica that handled the write. Other replicas pick up the
change when their cache entry's safety-net TTL expires:

- gallery listings: ~60s
- album nav / public config: ~1h (admin writes still bust them instantly on the
  writing replica; the TTL only bounds cross-replica propagation)

If you need instant cross-replica consistency for admin changes, a shared
PostgreSQL-backed cache handler is the planned next step (it routes the Data Cache
through Postgres + `LISTEN/NOTIFY` so an invalidation on one replica is seen by all).

## 5. In-flight task cancellation

Cancelling a running preprocess/metadata task signals the replica that owns the
run. If the cancel request lands on a different replica, it is still recorded, and
the running replica stops at the next lease checkpoint (within the lease window).
For rare admin actions this lag is acceptable; a fully cross-replica cancel signal
is a planned follow-up.
