'use client'

import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from '@nextui-org/react'
import { usePathname, useRouter } from 'next/navigation'
import { loginOut } from '~/server/lib/actions'
import { useSession } from 'next-auth/react'
import { CameraIcon } from '~/style/icons/Camera'
import { AvatarIcon, MonitorMobileIcon, CloseIcon, AnchorIcon, MoonFilledIcon, SunFilledIcon } from '@nextui-org/shared-icons'
import { GithubIcon } from '~/style/icons/GitHub'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export const DropMenu = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  const iconClasses = 'text-xl text-default-500 pointer-events-none flex-shrink-0'

  useEffect(() => {
    setMounted(true)
  }, [])

  if(!mounted) return null

  return (
    <Dropdown>
      <DropdownTrigger>
        <Avatar
          className="cursor-pointer"
          size="sm"
          isBordered
          src={session?.user?.image || ''}
          fallback={
            <CameraIcon className="animate-pulse w-6 h-6 text-default-500" fill="currentColor" size={20} />
          }
        />
      </DropdownTrigger>
        {
          session ?
            <DropdownMenu aria-label="下拉菜单">
              {
                pathname.startsWith('/admin') ?
                  <DropdownItem
                    key="home"
                    startContent={<AnchorIcon className={iconClasses} />}
                    onClick={() => router.push('/')}
                  >
                    首页
                  </DropdownItem>
                  :
                  <DropdownItem
                    key="admin"
                    startContent={<MonitorMobileIcon className={iconClasses} />}
                    onClick={() => router.push('/admin')}
                  >
                    后台
                  </DropdownItem>
              }
              <DropdownItem
                key="loginOut"
                startContent={<CloseIcon className={iconClasses} />}
                showDivider
              >
                <div onClick={async () => {
                  await loginOut()
                }}>
                  退出登录
                </div>
              </DropdownItem>
              <DropdownItem
                key="theme"
                startContent={theme === 'light' ? <SunFilledIcon className={iconClasses} /> : <MoonFilledIcon className={iconClasses} />}
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                { theme === 'light' ? '切换至⌈常夜⌋' : '切换至⌈白夜⌋' }
              </DropdownItem>
              <DropdownItem
                key="github"
                startContent={<GithubIcon className={iconClasses} />}
                onClick={() => router.push('https://github.com/besscroft')}
              >
                GitHub
              </DropdownItem>
            </DropdownMenu>
            :
            <DropdownMenu aria-label="下拉菜单">
              <DropdownItem
                key="login"
                showDivider
                onClick={() => router.push('/login')}
                startContent={<AvatarIcon className={iconClasses} />}
              >
                登录
              </DropdownItem>
              <DropdownItem
                key="theme"
                startContent={theme === 'light' ? <SunFilledIcon className={iconClasses} /> : <MoonFilledIcon className={iconClasses} />}
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                { theme === 'light' ? '切换至⌈常夜⌋' : '切换至⌈白夜⌋' }
              </DropdownItem>
              <DropdownItem
                key="github"
                startContent={<GithubIcon className={iconClasses} />}
                onClick={() => router.push('https://github.com/besscroft')}
              >
                GitHub
              </DropdownItem>
            </DropdownMenu>
        }
    </Dropdown>
  )
}