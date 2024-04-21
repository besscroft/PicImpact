import { auth } from '~/server/auth'

export async function getCurrentUser() {
  const { user } = await auth()

  return user
}