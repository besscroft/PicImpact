import { auth } from '~/server/auth'


export async function getCurrentUser() {
  const session = await auth()

  return session?.user
}