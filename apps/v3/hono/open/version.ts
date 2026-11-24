import 'server-only'

import { Hono } from 'hono'
import { ok } from '~/hono/_lib/response'

const app = new Hono()

// Public deployment marker. Returns the git commit the running image was built
// from (`BUILD_SHA`, injected as a Docker build-arg by the build-main workflow).
// Lets a deploy be verified at a glance — `curl /api/public/version` reports the
// commit actually running — instead of guessing whether `:latest` is the branch
// HEAD (which has repeatedly caused half-deploy confusion). Falls back to
// "unknown" for local/dev builds where the arg isn't set.
app.get('/', (c) => {
  return ok(c, { sha: process.env.BUILD_SHA ?? 'unknown' })
})

export default app
