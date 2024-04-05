import { auth } from '~/utils/lib/auth'

export async function getCurrentUser() {
  const session = await auth()

  return session?.user
}