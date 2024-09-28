'use client'

import { Listbox, ListboxItem } from '@nextui-org/react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next-nprogress-bar'
import { Settings, Milestone, Image, ImageUp, MonitorDot, Copyright, Info } from 'lucide-react'
import { cn } from '~/utils'

export const BaseSide = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const iconClasses = 'text-xl text-default-500 pointer-events-none flex-shrink-0'
  const buttonClasses = 'active:scale-95 duration-200 ease-in-out'
  const textClasses = 'text-lg font-sans select-none'
  const activeClasses = 'bg-black text-white dark:bg-white dark:text-black'

  return (
    <div className="w-full h-full p-2">
      <div className="w-full px-1 py-2">
        <Listbox
          aria-label="移动端菜单"
        >
          <ListboxItem
            className={cn(
              pathname === '/admin' ? activeClasses : '',
              buttonClasses
            )}
            key="home"
            startContent={<MonitorDot size={20} className={iconClasses}/>}
            onClick={() => router.push('/admin')}
          >
            <span className={textClasses}>控制台</span>
          </ListboxItem>
          <ListboxItem
            className={cn(
              pathname === '/admin/upload' ? activeClasses : '',
              buttonClasses
            )}
            key="upload"
            startContent={<ImageUp size={20} className={iconClasses}/>}
            onClick={() => router.push('/admin/upload')}
          >
            <span className={textClasses}>上传</span>
          </ListboxItem>
          <ListboxItem
            className={cn(
              pathname === '/admin/list' ? activeClasses : '',
              buttonClasses
            )}
            key="list"
            startContent={<Image size={20} className={iconClasses}/>}
            onClick={() => router.push('/admin/list')}
          >
            <span className={textClasses}>图片维护</span>
          </ListboxItem>
          <ListboxItem
            className={cn(
              pathname === '/admin/tag' ? activeClasses : '',
              buttonClasses
            )}
            key="tag"
            startContent={<Milestone size={20} className={iconClasses}/>}
            onClick={() => router.push('/admin/tag')}
          >
            <span className={textClasses}>相册管理</span>
          </ListboxItem>
          <ListboxItem
            className={cn(
              pathname === '/admin/copyright' ? activeClasses : '',
              buttonClasses
            )}
            key="tag"
            startContent={<Copyright size={20} className={iconClasses}/>}
            onClick={() => router.push('/admin/copyright')}
          >
            <span className={textClasses}>版权管理</span>
          </ListboxItem>
          <ListboxItem
            className={cn(
              pathname.startsWith('/admin/settings') ? activeClasses : '',
              buttonClasses
            )}
            key="settings"
            startContent={<Settings size={20} className={iconClasses}/>}
            onClick={() => router.push('/admin/settings/preferences')}
          >
            <span className={textClasses}>设置</span>
          </ListboxItem>
          <ListboxItem
            className={cn(
              pathname === '/admin/about' ? activeClasses : '',
              buttonClasses
            )}
            key="tag"
            startContent={<Info size={20} className={iconClasses}/>}
            onClick={() => router.push('/admin/about')}
          >
            <span className={textClasses}>关于</span>
          </ListboxItem>
        </Listbox>
      </div>
    </div>
  )
}