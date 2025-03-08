'use client'

import { usePathname } from 'next/navigation'
import { useRouter } from 'next-nprogress-bar'
import { loginOut } from '~/server/actions'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Home, MonitorDot, SunMedium, MoonStar, Github, LogOut, LogIn, Languages } from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { setUserLocale } from '~/lib/utils/locale.ts'
import { useTranslations } from 'next-intl'

export const DropMenu = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session} = useSession()
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const t = useTranslations()

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
                  <Home size={20} className={iconClasses} />{t('Link.home')}
                </DropdownMenuItem>
                :
                <DropdownMenuItem
                  key="admin"
                  onClick={() => router.push('/admin')}
                  className="cursor-pointer"
                >
                  <MonitorDot size={20} className={iconClasses} />{t('Link.dashboard')}
                </DropdownMenuItem>
            }
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Languages size={20} className={iconClasses} />{t('Button.language')}</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('zh')}>简体中文</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('zh-TW')}>繁體中文</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('en')}>English</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('ja')}>日本語</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem
              key="loginOut"
              onClick={async () => {
                try {
                  await loginOut()
                  setTimeout(() => {
                    location.replace('/login')
                  }, 1000);
                } catch (e) {
                  console.error(e)
                }
              }}
              className="cursor-pointer"
            >
              <LogOut size={20} className={iconClasses} />{t('Login.logout')}
            </DropdownMenuItem>
            <DropdownMenuItem
              key="theme"
              onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
              className="cursor-pointer"
            >
              {resolvedTheme === 'light' ? <MoonStar size={20} className={iconClasses} /> : <SunMedium size={20} className={iconClasses} />}
              { resolvedTheme === 'light' ? t('Button.dark') : t('Button.light') }
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
              <LogIn size={20} className={iconClasses} />{t('Button.login')}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Languages size={20} className={iconClasses} />{t('Button.language')}</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('zh')}>简体中文</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('zh-TW')}>繁體中文</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('en')}>English</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('ja')}>日本語</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem
              key="theme"
              onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
              className="cursor-pointer"
            >
              {resolvedTheme === 'light' ? <MoonStar size={20} className={iconClasses} /> : <SunMedium size={20} className={iconClasses} />}
              { resolvedTheme === 'light' ? t('Button.dark') : t('Button.light') }
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