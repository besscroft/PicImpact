'use client'

import { Drawer } from 'vaul'
import { usePathname, useRouter } from 'next/navigation'
import { Listbox, ListboxItem } from '@nextui-org/react'
import {
  AnchorIcon,
  AvatarIcon,
  CloseIcon,
  LockFilledIcon,
  MonitorMobileIcon,
  MoonFilledIcon,
  SunFilledIcon
} from '@nextui-org/shared-icons'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { loginOut } from '~/server/lib/actions'
import { AppIcon } from '~/style/icons/App'

export default function VaulDrawer() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  const iconClasses = 'text-xl text-default-500 pointer-events-none flex-shrink-0'

  useEffect(() => {
    setMounted(true)
  }, [])

  if(!mounted) return null

  return (
    <Drawer.Root>
      <Drawer.Trigger>
        <AppIcon aria-label="菜单" className="rounded dark:bg-blue-50" />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 dark:bg-slate-800" />
        <Drawer.Content className="bg-zinc-100 dark:bg-slate-900 flex flex-col rounded-t-[10px] h-[88%] mt-24 fixed bottom-0 left-0 right-0">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-t-[10px] flex-1">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mb-8" />
            <div className="flex flex-col gap-4">
              <div className="w-full px-1 py-2 rounded-small">
                {
                  session ?
                    <Listbox
                      aria-label="移动端菜单"
                    >
                      {
                        pathname.startsWith('/admin') ?
                          <ListboxItem
                            key="home"
                            startContent={<AnchorIcon className={iconClasses} />}
                            onClick={() => router.push('/')}
                          >
                            首页
                          </ListboxItem>
                          :
                          <ListboxItem
                            key="home"
                            startContent={<MonitorMobileIcon className={iconClasses} />}
                            onClick={() => router.push('/admin')}
                          >
                            后台
                          </ListboxItem>
                      }
                      <ListboxItem
                        key="settings"
                        startContent={<LockFilledIcon className={iconClasses} />}
                        onClick={() => router.push('/admin/settings')}
                      >
                        设置
                      </ListboxItem>
                      <ListboxItem
                        key="loginOut"
                        startContent={<CloseIcon className={iconClasses} />}
                        showDivider
                      >
                        <div onClick={async () => {
                          await loginOut()
                        }}>
                          退出登录
                        </div>
                      </ListboxItem>
                      <ListboxItem
                        key="theme"
                        startContent={theme === 'light' ? <SunFilledIcon className={iconClasses} /> : <MoonFilledIcon className={iconClasses} />}
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                      >
                        { theme === 'light' ? '切换至⌈常夜⌋' : '切换至⌈白夜⌋' }
                      </ListboxItem>
                    </Listbox>
                    :
                    <Listbox
                      aria-label="移动端菜单"
                    >
                      <ListboxItem
                        key="login"
                        showDivider
                        onClick={() => router.push('/login')}
                        startContent={<AvatarIcon className={iconClasses} />}
                      >
                        登录
                      </ListboxItem>
                      <ListboxItem
                        key="theme"
                        startContent={theme === 'light' ? <SunFilledIcon className={iconClasses} /> : <MoonFilledIcon className={iconClasses} />}
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                      >
                        { theme === 'light' ? '切换至⌈常夜⌋' : '切换至⌈白夜⌋' }
                      </ListboxItem>
                    </Listbox>
                }
              </div>
            </div>
          </div>
          <div className="p-4 bg-zinc-100 dark:bg-slate-800 border-t border-zinc-200 mt-auto">
            <div className="flex gap-6 justify-end max-w-md mx-auto">
              <a
                className="text-xs text-zinc-600 flex items-center gap-0.25"
                href="https://github.com/besscroft"
                target="_blank"
              >
                GitHub
                <svg
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  width="16"
                  aria-hidden="true"
                  className="w-3 h-3 ml-1"
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"></path>
                  <path d="M15 3h6v6"></path>
                  <path d="M10 14L21 3"></path>
                </svg>
              </a>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}