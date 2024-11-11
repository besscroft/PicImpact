'use client'

import { usePathname } from 'next/navigation'
import { useRouter } from 'next-nprogress-bar'
import { loginOut } from '~/server/actions'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Home, MonitorDot, SunMedium, MoonStar, Github, LogOut, LogIn } from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar aria-label="下拉菜单" className="size-8 cursor-pointer">
          <AvatarImage
            src={session?.user?.image || ''}
            alt="头像"
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      {
        session ?
          <DropdownMenuContent aria-label="下拉菜单">
            {
              pathname.startsWith('/admin') ?
                <DropdownMenuItem
                  key="home"
                  onClick={() => router.push('/')}
                  className="cursor-pointer"
                >
                  <Home size={20} className={iconClasses} />首页
                </DropdownMenuItem>
                :
                <DropdownMenuItem
                  key="admin"
                  onClick={() => router.push('/admin')}
                  className="cursor-pointer"
                >
                  <MonitorDot size={20} className={iconClasses} />控制台
                </DropdownMenuItem>
            }
            <DropdownMenuItem
              key="loginOut"
              onClick={async () => {
                try {
                  await loginOut()
                  setTimeout(() => {
                    location.replace('/login')
                  }, 1000);
                } catch (e) {
                  console.log(e)
                }
              }}
              className="cursor-pointer"
            >
              <LogOut size={20} className={iconClasses} />退出登录
            </DropdownMenuItem>
            <DropdownMenuItem
              key="theme"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="cursor-pointer"
            >
              {theme === 'light' ? <MoonStar size={20} className={iconClasses} /> : <SunMedium size={20} className={iconClasses} />}
              { theme === 'light' ? '切换至⌈常夜⌋' : '切换至⌈白夜⌋' }
            </DropdownMenuItem>
            <DropdownMenuItem
              key="github"
              onClick={() => router.push('https://github.com/besscroft/PicImpact')}
              className="cursor-pointer"
            >
              <Github size={20} className={iconClasses} />GitHub
            </DropdownMenuItem>
          </DropdownMenuContent>
          :
          <DropdownMenuContent aria-label="下拉菜单">
            <DropdownMenuItem
              key="login"
              onClick={() => router.push('/login')}
              className="cursor-pointer"
            >
              <LogIn size={20} className={iconClasses} />登录
            </DropdownMenuItem>
            <DropdownMenuItem
              key="theme"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="cursor-pointer"
            >
              {theme === 'light' ? <MoonStar size={20} className={iconClasses} /> : <SunMedium size={20} className={iconClasses} />}
              { theme === 'light' ? '切换至⌈常夜⌋' : '切换至⌈白夜⌋' }
            </DropdownMenuItem>
            <DropdownMenuItem
              key="github"
              onClick={() => router.push('https://github.com/besscroft/PicImpact')}
              className="cursor-pointer"
            >
              <Github size={20} className={iconClasses} />GitHub
            </DropdownMenuItem>
          </DropdownMenuContent>
      }
    </DropdownMenu>
  )
}