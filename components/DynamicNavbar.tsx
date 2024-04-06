import { ThemeSwitch } from '~/components/DarkToggle'
import VaulDrawer from '~/components/VaulDrawer'
import { DropMenu } from '~/components/DropMenu'
import { getCurrentUser } from '~/server/lib/user'
import Link from 'next/link'

export default async function DynamicNavbar() {
  const user = await getCurrentUser()

  return (
    <>
      {user ?
        <>
          <div className="flex sm:hidden">
            <VaulDrawer/>
          </div>
          <div className="hidden sm:flex space-x-2">
            <ThemeSwitch/>
            <DropMenu/>
          </div>
        </>
        :
        <div className="flex items-center space-x-4 cursor-pointer select-none">
          <ThemeSwitch/>
          <Link href="/login">
            登录
          </Link>
        </div>
      }
    </>
  )
}