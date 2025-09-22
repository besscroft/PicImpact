export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    console.info('Runtime is edge, skipping instrumentation setup.')
  }
}
