'use client'

import {
  ChevronsUpDown,
  LogOut,
  MoonStar,
  SunMedium,
} from 'lucide-react'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar'
import { useSession } from 'next-auth/react'
import { loginOut } from '~/server/actions'
import { useTheme } from 'next-themes'
import * as React from 'react'

export function NavUser() {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const { data: session, status } = useSession()
  const iconClasses = 'text-xl text-default-500 pointer-events-none flex-shrink-0'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={session?.user?.image} alt={session?.user?.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{session?.user?.name}</span>
                <span className="truncate text-xs">{session?.user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={session?.user?.image} alt={session?.user?.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{session?.user?.name}</span>
                  <span className="truncate text-xs">{session?.user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <MoonStar size={20} className={iconClasses} /> : <SunMedium size={20} className={iconClasses} />}
              <span>{ theme === 'light' ? '切换至⌈常夜⌋' : '切换至⌈白夜⌋' }</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={async () => {
              try {
                await loginOut()
                setTimeout(() => {
                  location.replace('/login')
                }, 1000);
              } catch (e) {
                console.log(e)
              }
            }}>
              <LogOut />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
