'use client'

import { Listbox, ListboxItem } from '@nextui-org/react'
import {
  MonitorMobileIcon,
  LockFilledIcon,
} from '@nextui-org/shared-icons'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'

export const BaseSide = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const iconClasses = 'text-xl text-default-500 pointer-events-none flex-shrink-0'
  const buttonClasses = 'active:scale-95 duration-200 ease-in-out'

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 w-full h-full p-2">
      <div className="w-full px-1 py-2 rounded-small">
        <Listbox
          aria-label="移动端菜单"
        >
          <ListboxItem
            className={pathname === '/admin' ? 'text-teal-300 ' + buttonClasses : buttonClasses}
            key="home"
            startContent={<MonitorMobileIcon className={iconClasses}/>}
            onClick={() => router.push('/admin')}
          >
            控制台
          </ListboxItem>
          <ListboxItem
            className={pathname === '/admin/settings' ? 'text-teal-400 ' + buttonClasses : buttonClasses}
            key="settings"
            startContent={<LockFilledIcon className={iconClasses}/>}
            onClick={() => router.push('/admin/settings')}
          >
            设置
          </ListboxItem>
        </Listbox>
      </div>
    </div>
  )
}