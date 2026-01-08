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
      maxAge: 30 * 60 // Cache duration in seconds
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