import { auth } from '~/utils/lib/auth'

export async function getSession() {
  const session = await auth()

  return session
}