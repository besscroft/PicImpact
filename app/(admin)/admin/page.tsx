import { auth } from '~/utils/lib/auth'

export default async function Admin() {
  const session = await auth()

  return (
    <>
      控制台 {session?.user}
    </>
  )
}