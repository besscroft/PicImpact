import { createAuthClient } from 'better-auth/react' // make sure to import from better-index/react
import { twoFactorClient, passkeyClient } from 'better-auth/client/plugins'

export const authClient =  createAuthClient({
  plugins: [
    twoFactorClient(),
    passkeyClient()
  ]
})