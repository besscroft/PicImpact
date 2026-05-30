import 'server-only'

import { createPreprocessTaskRun, tickPreprocessTaskRuns } from '~/server/tasks/image-preprocess-service'

/**
 * Background driver for the image-preprocessing queue.
 *
 * Uploads no longer process variants inline — a new image is simply stored with
 * `variants_ready=false`. This ticker periodically (a) creates a preprocess
 * AdminTaskRun when images are pending and none is active, then (b) drains the
 * active run a batch at a time. So new uploads (and any backlog) are turned into
 * variants asynchronously, with every run visible/cancellable in /admin/tasks.
 *
 * Driving here (rather than only when the admin opens /admin/tasks) is what
 * makes it truly hands-off. Requires a long-lived process (Node/Docker); on
 * serverless there is no persistent process, so this no-ops and an external cron
 * hitting POST /api/v1/preprocess-tasks/tick should drive the queue instead.
 */

const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'cancelled'])
const FIRST_RUN_DELAY_MS = 30_000
const INTERVAL_MS = 10_000
// Upper bound on batches drained per cycle so one cycle can't monopolise the
// process indefinitely; the next cycle continues any remaining work.
const MAX_BATCHES_PER_CYCLE = 100

let started = false
let running = false

function tickerEnabled(): boolean {
  const flag = process.env.PREPROCESS_TICKER_ENABLED
  // Explicit env wins; otherwise default to production only so `next dev`
  // doesn't silently start generating variants locally.
  if (flag != null && flag !== '') return flag === 'true'
  return process.env.NODE_ENV === 'production'
}

async function drainCycle(): Promise<void> {
  // In-process guard: if the previous cycle is still draining (a batch can take
  // longer than the interval), skip rather than stack overlapping cycles. The
  // advisory lock inside the tick path additionally guards across processes.
  if (running) return
  running = true
  try {
    // Create a run for pending images when none is active. Expected throws are
    // benign: variant_storage unconfigured, a run already active, or no images
    // pending — all mean "nothing to start right now".
    try {
      await createPreprocessTaskRun({ force: false })
    } catch {
      // ignore
    }

    for (let i = 0; i < MAX_BATCHES_PER_CYCLE; i += 1) {
      const { activeRun } = await tickPreprocessTaskRuns()
      if (!activeRun || TERMINAL_STATUSES.has(activeRun.status)) break
    }
  } catch (error) {
    console.warn('Preprocess ticker cycle failed:', error instanceof Error ? error.message : error)
  } finally {
    running = false
  }
}

/**
 * Start the background preprocess ticker. Safe to call multiple times (only the
 * first call starts it). No-ops outside the Node.js runtime or when disabled.
 */
export function startPreprocessTicker(): void {
  if (started) return
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (!tickerEnabled()) return
  started = true

  // Delay the first cycle so a cold start with a large backlog doesn't spike
  // CPU before the app has finished booting.
  setTimeout(() => {
    void drainCycle()
    setInterval(() => {
      void drainCycle()
    }, INTERVAL_MS)
  }, FIRST_RUN_DELAY_MS)
}
