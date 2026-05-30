export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    console.info('Runtime is edge, skipping instrumentation setup.')
    return
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Start the background image-preprocessing ticker, which turns newly
    // uploaded (and backlogged) images into responsive variants asynchronously
    // via the AdminTaskRun queue. No-ops when disabled or unconfigured.
    const { startPreprocessTicker } = await import('~/server/tasks/preprocess-ticker')
    startPreprocessTicker()
  }
}
