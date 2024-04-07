'use client'

import { Drawer } from 'vaul'
import { usePathname, useRouter } from 'next/navigation'
import { Listbox, ListboxItem } from '@nextui-org/react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { loginOut } from '~/server/lib/actions'
import {
  BookmarkIcon,
  DashboardIcon,
  DesktopIcon,
  ExitIcon,
  GearIcon,
  HomeIcon,
  InfoCircledIcon,
  MoonIcon,
  Pencil2Icon,
  PersonIcon,
  RocketIcon,
  SunIcon
} from '@radix-ui/react-icons'


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
        <DashboardIcon aria-label="菜单" className="rounded dark:bg-blue-50" />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background">
          <div className="p-4 rounded-t-[10px] flex-1">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-2" />
            <div className="flex flex-col gap-4">
              <div className="w-full px-1 py-2 rounded-small">
                {
                  session ?
                    <Listbox
                      aria-label="移动端菜单"
                    >
                      {
                        pathname.startsWith('/admin') ?
                          pathname === '/admin' ?
                            <ListboxItem
                              key="home"
                              startContent={<HomeIcon className={iconClasses} />}
                              onClick={() => router.push('/')}
                            >
                              <Drawer.Close className="w-full text-left">
                                首页
                              </Drawer.Close>
                            </ListboxItem>
                            :
                            <ListboxItem
                              key="home"
                              startContent={<DesktopIcon className={iconClasses} />}
                              onClick={() => router.push('/admin')}
                            >
                              <Drawer.Close className="w-full text-left">
                                控制台
                              </Drawer.Close>
                            </ListboxItem>
                          :
                          <ListboxItem
                            key="home"
                            startContent={<DesktopIcon className={iconClasses} />}
                            onClick={() => router.push('/admin')}
                          >
                            <Drawer.Close className="w-full text-left">
                              控制台
                            </Drawer.Close>
                          </ListboxItem>
                      }
                      <ListboxItem
                        key="upload"
                        startContent={<RocketIcon className={iconClasses} />}
                        onClick={() => router.push('/admin/upload')}
                      >
                        <Drawer.Close className="w-full text-left">
                          上传
                        </Drawer.Close>
                      </ListboxItem>
                      <ListboxItem
                        key="list"
                        startContent={<Pencil2Icon className={iconClasses} />}
                        onClick={() => router.push('/admin/list')}
                      >
                        <Drawer.Close className="w-full text-left">
                          图片维护
                        </Drawer.Close>
                      </ListboxItem>
                      <ListboxItem
                        key="tag"
                        startContent={<BookmarkIcon className={iconClasses} />}
                        onClick={() => router.push('/admin/tag')}
                      >
                        <Drawer.Close className="w-full text-left">
                          标签管理
                        </Drawer.Close>
                      </ListboxItem>
                      <ListboxItem
                        key="settings"
                        startContent={<GearIcon className={iconClasses} />}
                        onClick={() => router.push('/admin/settings')}
                        showDivider
                      >
                        <Drawer.Close className="w-full text-left">
                          设置
                        </Drawer.Close>
                      </ListboxItem>
                      <ListboxItem
                        key="loginOut"
                        startContent={<ExitIcon className={iconClasses} />}
                      >
                        <div onClick={async () => {
                          await loginOut()
                        }}>
                          退出登录
                        </div>
                      </ListboxItem>
                      <ListboxItem
                        key="theme"
                        startContent={theme === 'light' ? <SunIcon className={iconClasses} /> : <MoonIcon className={iconClasses} />}
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
                        key="home"
                        onClick={() => router.push('/')}
                        startContent={<HomeIcon className={iconClasses} />}
                      >
                        <Drawer.Close className="w-full text-left">
                          首页
                        </Drawer.Close>
                      </ListboxItem>
                      <ListboxItem
                        key="about"
                        showDivider
                        onClick={() => router.push('/about')}
                        startContent={<InfoCircledIcon className={iconClasses} />}
                      >
                        <Drawer.Close className="w-full text-left">
                          关于
                        </Drawer.Close>
                      </ListboxItem>
                      <ListboxItem
                        key="login"
                        onClick={() => router.push('/login')}
                        startContent={<PersonIcon className={iconClasses} />}
                      >
                        登录
                      </ListboxItem>
                      <ListboxItem
                        key="theme"
                        startContent={theme === 'light' ? <SunIcon className={iconClasses} /> : <MoonIcon className={iconClasses} />}
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                      >
                        { theme === 'light' ? '切换至⌈常夜⌋' : '切换至⌈白夜⌋' }
                      </ListboxItem>
                    </Listbox>
                }
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-zinc-200 mt-auto">
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