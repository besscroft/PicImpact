'use client'

import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from '@nextui-org/react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next-nprogress-bar'
import { loginOut } from '~/server/lib/actions'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Home, MonitorDot, SunMedium, MoonStar, Github, LogOut, LogIn } from 'lucide-react'

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
    <Dropdown shadow="sm">
      <DropdownTrigger>
        <Avatar
          className="cursor-pointer"
          size="sm"
          isBordered
          src={session?.user?.image || ''}
          aria-label="下拉菜单"
        />
      </DropdownTrigger>
        {
          session ?
            <DropdownMenu aria-label="下拉菜单">
              {
                pathname.startsWith('/admin') ?
                  <DropdownItem
                    key="home"
                    startContent={<Home size={20} className={iconClasses} />}
                    onClick={() => router.push('/')}
                  >
                    首页
                  </DropdownItem>
                  :
                  <DropdownItem
                    key="admin"
                    startContent={<MonitorDot size={20} className={iconClasses} />}
                    onClick={() => router.push('/admin')}
                  >
                    控制台
                  </DropdownItem>
              }
              <DropdownItem
                key="loginOut"
                startContent={<LogOut size={20} className={iconClasses} />}
                showDivider
              >
                <div onClick={async () => {
                  try {
                    await loginOut()
                    setTimeout(() => {
                      location.replace('/login')
                    }, 1000);
                  } catch (e) {
                    console.log(e)
                  }
                }}>
                  退出登录
                </div>
              </DropdownItem>
              <DropdownItem
                key="theme"
                startContent={theme === 'light' ? <SunMedium size={20} className={iconClasses} /> : <MoonStar size={20} className={iconClasses} />}
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                { theme === 'light' ? '切换至⌈常夜⌋' : '切换至⌈白夜⌋' }
              </DropdownItem>
              <DropdownItem
                key="github"
                startContent={<Github size={20} className={iconClasses} />}
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
                startContent={<LogIn size={20} className={iconClasses} />}
              >
                登录
              </DropdownItem>
              <DropdownItem
                key="theme"
                startContent={theme === 'light' ? <SunMedium size={20} className={iconClasses} /> : <MoonStar size={20} className={iconClasses} />}
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                { theme === 'light' ? '切换至⌈常夜⌋' : '切换至⌈白夜⌋' }
              </DropdownItem>
              <DropdownItem
                key="github"
                startContent={<Github size={20} className={iconClasses} />}
                onClick={() => router.push('https://github.com/besscroft')}
              >
                GitHub
              </DropdownItem>
            </DropdownMenu>
        }
    </Dropdown>
  )
}