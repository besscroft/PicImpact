import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { db } from '~/server/lib/db'
import { nextCookies } from 'better-auth/next-js'
import { customSession, twoFactor  } from 'better-auth/plugins'
import { passkey } from '@better-auth/passkey'

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  advanced: {
    cookiePrefix: 'pic-impact'
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      // Short TTL so a sign-out / ban propagates quickly across replicas. The
      // signed cookie cache is per-instance in-memory state, so a longer TTL
      // would let a revoked session keep validating on a replica that still
      // holds the cached cookie until it expires. 60s bounds that lag while
      // still absorbing the bulk of repeat reads. Cache duration in seconds.
      maxAge: 60
    }
  },
  plugins: [
    nextCookies(),
    twoFactor(),
    passkey({
      rpID: process.env.BETTER_AUTH_PASSKEY_RP_ID || 'localhost',
      rpName: process.env.BETTER_AUTH_PASSKEY_RP_NAME || 'PicImpact'
    }),
    customSession(async ({ user, session }) => {
      // 可拓展 session
      return {
        user,
        session
      }
    }),
  ],
  rateLimit: {
    window: 10, // time window in seconds
    max: 100, // max requests in the window
  },
  emailAndPassword: {
    enabled: true
  },
})