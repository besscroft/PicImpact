import { createAuthClient } from 'better-auth/react' // make sure to import from better-index/react
import { twoFactorClient } from 'better-auth/client/plugins'
import { passkeyClient } from '@better-auth/passkey/client'

export const authClient =  createAuthClient({
  plugins: [
    twoFactorClient(),
    passkeyClient()
  ]
})