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
  listPreprocessTaskRuns,
  tickPreprocessTaskRuns,
  type PreprocessTaskRunSummary,
} from '~/server/tasks/image-preprocess-service'
import { normalizePreprocessTaskScope } from '~/types/admin-tasks'

const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'cancelled'])

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
  for (;;) {
    const { activeRun } = await tickPreprocessTaskRuns()
    if (!activeRun) break
    logProgress(activeRun)
    if (TERMINAL_STATUSES.has(activeRun.status)) break
  }

  // Report the final state of the most recent run.
  const { recentRuns, activeRun } = await listPreprocessTaskRuns()
  const finalRun = activeRun ?? recentRuns[0]
  if (finalRun) {
    console.info(
      `Done — ${finalRun.status}: ${finalRun.successCount} ok, `
      + `${finalRun.failedCount} failed, ${finalRun.processedCount}/${finalRun.totalCount} processed.`,
    )
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
