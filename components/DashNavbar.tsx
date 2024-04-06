import { ThemeSwitch } from '~/components/DarkToggle'
import DashVaulDrawer from '~/components/DashVaulDrawer'
import { DashDropMenu } from '~/components/DashDropMenu'
import { getCurrentUser } from '~/server/lib/user'
import Link from "next/link";

export default async function DashNavbar() {
  const user = await getCurrentUser()

  return (
    <>
      {user ?
        <>
          <div className="flex sm:hidden">
            <DashVaulDrawer/>
          </div>
          <div className="hidden space-x-2 sm:flex">
            <ThemeSwitch/>
            <DashDropMenu/>
          </div>
        </>
        :
        <div className="flex items-center space-x-4 cursor-pointer select-none">
          <ThemeSwitch/>
          <Link href="/">
            登录
          </Link>
        </div>
      }
    </>
  )
}