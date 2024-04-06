import { getCurrentUser } from '~/server/lib/user'

export default async function Admin() {
  const user = await getCurrentUser()

  return (
    <>
      { user ?
        '控制台（已登录）'
        :
        '控制台（未登录）'
      }
    </>
  )
}