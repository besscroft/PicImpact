import { getCurrentUser } from '~/server/lib/user'

export default async function Admin() {
  const user = await getCurrentUser()

  return (
    <>
      { user ?
        <div>
          <p>控制台（已登录）</p>
          <p>{JSON.stringify(user)}</p>
        </div>
        :
        '控制台（未登录）'
      }
    </>
  )
}