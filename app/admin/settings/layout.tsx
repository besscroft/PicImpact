'use client'

import { usePathname } from 'next/navigation'
import { cn } from '~/utils'
import { Listbox, ListboxItem } from '@nextui-org/react'
import { SlidersHorizontal, Server, Info, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname()
  const router = useRouter()

  const iconClasses = 'text-xl text-default-500 pointer-events-none flex-shrink-0'
  const buttonClasses = 'active:scale-95 duration-200 ease-in-out'
  return (
    <div className="h-full flex">
      <div className={cn('min-w-64 sm:border-r-1 h-full',
        pathname === '/admin/settings' ? 'block sm:flex-none flex-1' : 'hidden sm:block'
      )}>
        <Listbox
          aria-label="设置页二级菜单"
        >
          <ListboxItem
            className={cn(
              pathname === '/admin/settings/preferences' ? 'text-teal-400' : '',
              buttonClasses
            )}
            key="home"
            startContent={<SlidersHorizontal size={20} className={iconClasses}/>}
            onClick={() => router.push('/admin/settings/preferences')}
          >
            <span className="text-lg font-sans">首选项</span>
          </ListboxItem>
          <ListboxItem
            className={cn(
              pathname === '/admin/settings/storages' ? 'text-teal-400' : '',
              buttonClasses
            )}
            key="upload"
            startContent={<Server size={20} className={iconClasses}/>}
            onClick={() => router.push('/admin/settings/storages')}
          >
            <span className="text-lg font-sans">存储设置</span>
          </ListboxItem>
          <ListboxItem
            className={cn(
              pathname === '/admin/settings/about' ? 'text-teal-400' : '',
              buttonClasses
            )}
            key="list"
            startContent={<Info size={20} className={iconClasses}/>}
            onClick={() => router.push('/admin/settings/about')}
          >
            <span className="text-lg font-sans">关于</span>
          </ListboxItem>
        </Listbox>
      </div>
      <div className={pathname === '/admin/settings' ? 'hidden sm:block flex-1' : 'block flex-1'}>
        <div className={cn(
          'flex items-center p-2 border-b-1',
          pathname === '/admin/settings' ? 'hidden' : 'block'
        )}>
          <div className="flex items-center cursor-pointer" onClick={() => router.back()}>
            <ArrowLeft /><span>返回</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
