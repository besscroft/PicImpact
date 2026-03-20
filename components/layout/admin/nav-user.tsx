'use client'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar'
import { authClient } from '~/server/auth/auth-client'
import { useTheme } from 'next-themes'
import { setUserLocale } from '~/lib/utils/locale'
import { useTranslations } from 'next-intl'
import { SunMoonIcon } from '~/components/icons/sun-moon'
import { SunMediumIcon } from '~/components/icons/sun-medium'
import { LanguagesIcon } from '~/components/icons/languages'
import { LogoutIcon } from '~/components/icons/logout'
import { ChevronsDownUpIcon } from '~/components/icons/chevrons-up-down'
import { useIsHydrated } from '~/hooks/use-is-hydrated'

export function NavUser() {
  const { isMobile } = useSidebar()
  const { resolvedTheme, setTheme } = useTheme()
  const isHydrated = useIsHydrated()
  const { data: session } = authClient.useSession()
  const t = useTranslations()
  const themeToggleLabel = isHydrated
    ? t(resolvedTheme === 'light' ? 'Button.dark' : 'Button.light')
    : t('Button.theme')

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="space-x-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg select-none">
                <AvatarImage src={session?.user?.image!} alt={session?.user?.name!} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight select-none">
                <span className="truncate font-semibold">{session?.user?.name}</span>
                <span className="truncate text-xs">{session?.user?.email}</span>
              </div>
              <ChevronsDownUpIcon size={18} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={session?.user?.image!} alt={session?.user?.name!} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{session?.user?.name}</span>
                  <span className="truncate text-xs">{session?.user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={!isHydrated}
              onClick={() => {
                if (!isHydrated) {
                  return
                }
                setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
              }}
            >
              {!isHydrated ? <SunMoonIcon size={18} /> : resolvedTheme === 'light' ? <SunMoonIcon size={18} /> : <SunMediumIcon size={18} />}
              <span>{themeToggleLabel}</span>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer"><LanguagesIcon size={18} />{t('Button.language')}</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('zh')}>简体中文</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('zh-TW')}>繁體中文</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('en')}>English</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('ja')}>日本語</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem className="cursor-pointer" onClick={async () => {
              try {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      location.replace('/login')
                    },
                  },
                })
              } catch (e) {
                console.error(e)
              }
            }}>
              <LogoutIcon size={18} />
              {t('Login.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
