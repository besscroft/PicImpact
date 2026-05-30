/**
 * Image variant backfill CLI (BE-3 part 3c).
 *
 * Generates responsive variants for existing images by creating a
 * `preprocess-images` task run and draining it to completion in-process — a
 * one-shot, headless alternative to clicking through the /admin/tasks button.
 * Best for the initial bulk backfill of an existing library.
 *
 * Run with the react-server export condition so `server-only` modules import
 * cleanly under tsx:
 *
 *   pnpm run preprocess:backfill           # only images missing variants
 *   pnpm run preprocess:backfill -- --force  # regenerate every image
 *
 * Requires DATABASE_URL (read by Prisma) and a configured `variant_storage`
 * backend (Admin → Settings → Storages → Variant storage).
 */

import { db } from '~/server/lib/db'
import {
  createPreprocessTaskRun,
  getPreprocessTaskRunDetail,
  listPreprocessTaskRuns,
  tickPreprocessTaskRuns,
  type PreprocessTaskRunSummary,
} from '~/server/tasks/image-preprocess-service'
import { normalizePreprocessTaskScope } from '~/types/admin-tasks'

const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'cancelled'])
const TICK_INTERVAL_MS = 1000
// After this many consecutive no-progress ticks, assume the run is leased by
// another (possibly dead) process whose lease has not expired, and bail rather
// than spin forever.
const MAX_STALLED_TICKS = 8

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function logProgress(run: PreprocessTaskRunSummary) {
  const { processedCount, totalCount, successCount, failedCount, status } = run
  console.info(
    `  [${status}] ${processedCount}/${totalCount} processed `
    + `(${successCount} ok, ${failedCount} failed)`,
  )
}

async function main() {
  const force = process.argv.slice(2).includes('--force')
  const scope = normalizePreprocessTaskScope({ force })

  console.info(`Image variant backfill — scope: ${force ? 'all images (force)' : 'images missing variants'}`)

  // Create a run, or reuse an already-active one (e.g. left over from a prior
  // partial run or the admin UI) so we never double-create.
  try {
    const created = await createPreprocessTaskRun(scope)
    if (created) {
      console.info(`Created run ${created.id} — ${created.totalCount} image(s) to process.`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'No images matched the selected filters') {
      console.info('Nothing to do: no images need variant generation.')
      return
    }
    if (message === 'Another preprocess task is already active') {
      console.info('A preprocess run is already active — draining it.')
    } else {
      // e.g. "Variant storage backend is not configured"
      throw error
    }
  }

  // Drain: each tick processes one batch and returns the active run summary.
  // Sleep between ticks (avoid a hot loop) and bail if progress stalls — a
  // stall means the run is leased by another process whose lease has not
  // expired, so spinning would never make progress.
  let prevProcessed = -1
  let stalledTicks = 0
  for (;;) {
    const { activeRun } = await tickPreprocessTaskRuns()
    if (!activeRun) break
    logProgress(activeRun)
    if (TERMINAL_STATUSES.has(activeRun.status)) break

    if (activeRun.processedCount === prevProcessed) {
      // No progress: the run is likely held by another process whose lease has
      // not expired. Back off (sleep) and bail after too many stalls, rather
      // than spin. The sleep only applies here — while actively making
      // progress we drain at full speed with no inter-batch delay.
      stalledTicks += 1
      if (stalledTicks >= MAX_STALLED_TICKS) {
        console.error(
          `No progress after ${MAX_STALLED_TICKS} attempts — the run is likely held by `
          + 'another backfill process whose lease has not expired. Stop other backfill '
          + 'processes and wait for the lease (~5 min) to expire, or cancel the run, then retry.',
        )
        process.exitCode = 1
        break
      }
      await sleep(TICK_INTERVAL_MS)
    } else {
      stalledTicks = 0
      prevProcessed = activeRun.processedCount
    }
  }

  // Report the final state of the most recent run.
  const { recentRuns, activeRun } = await listPreprocessTaskRuns()
  const finalRun = activeRun ?? recentRuns[0]
  if (finalRun) {
    console.info(
      `Done — ${finalRun.status}: ${finalRun.successCount} ok, `
      + `${finalRun.failedCount} failed, ${finalRun.processedCount}/${finalRun.totalCount} processed.`,
    )

    // Surface why images failed (otherwise the only signal is the count, which
    // forces digging through the DB / API to diagnose).
    if (finalRun.failedCount > 0) {
      const detail = await getPreprocessTaskRunDetail(finalRun.id)
      if (detail && detail.recentIssues.length > 0) {
        console.error('\nRecent failures:')
        for (const issue of detail.recentIssues.slice(-5)) {
          console.error(`  [${issue.stage}/${issue.code}] ${issue.summary}${issue.detail ? ` — ${issue.detail}` : ''}`)
        }
      }
      if (detail?.lastError) {
        console.error(`  lastError: ${detail.lastError.message}${detail.lastError.detail ? ` — ${detail.lastError.detail}` : ''}`)
      }
    }

    if (finalRun.status === 'failed') {
      process.exitCode = 1
    }
  }
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
