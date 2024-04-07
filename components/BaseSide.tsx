'use client'

import { Listbox, ListboxItem} from '@nextui-org/react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { BookmarkIcon, DesktopIcon, GearIcon, Pencil2Icon, RocketIcon } from '@radix-ui/react-icons'

export const BaseSide = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const iconClasses = 'text-xl text-default-500 pointer-events-none flex-shrink-0'
  const buttonClasses = 'active:scale-95 duration-200 ease-in-out'

  return (
    <div className="w-full h-full p-2">
      <div className="w-full px-1 py-2 rounded-small">
        <Listbox
          aria-label="移动端菜单"
        >
          <ListboxItem
            className={pathname === '/admin' ? 'text-teal-300 ' + buttonClasses : buttonClasses}
            key="home"
            startContent={<DesktopIcon className={iconClasses}/>}
            onClick={() => router.push('/admin')}
          >
            控制台
          </ListboxItem>
          <ListboxItem
            className={pathname === '/admin/upload' ? 'text-teal-300 ' + buttonClasses : buttonClasses}
            key="upload"
            startContent={<RocketIcon className={iconClasses}/>}
            onClick={() => router.push('/admin/upload')}
          >
            上传
          </ListboxItem>
          <ListboxItem
            className={pathname === '/admin/list' ? 'text-teal-300 ' + buttonClasses : buttonClasses}
            key="list"
            startContent={<Pencil2Icon className={iconClasses}/>}
            onClick={() => router.push('/admin/list')}
          >
            图片维护
          </ListboxItem>
          <ListboxItem
            className={pathname === '/admin/tag' ? 'text-teal-300 ' + buttonClasses : buttonClasses}
            key="tag"
            startContent={<BookmarkIcon className={iconClasses}/>}
            onClick={() => router.push('/admin/tag')}
          >
            标签管理
          </ListboxItem>
          <ListboxItem
            className={pathname === '/admin/settings' ? 'text-teal-400 ' + buttonClasses : buttonClasses}
            key="settings"
            startContent={<GearIcon className={iconClasses}/>}
            onClick={() => router.push('/admin/settings')}
          >
            设置
          </ListboxItem>
        </Listbox>
      </div>
    </div>
  )
}