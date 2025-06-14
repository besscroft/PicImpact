import { authClient } from '~/server/auth/auth-client'

export async function getCurrentUser() {
  const { data: session } = await authClient.getSession()

  return session
}