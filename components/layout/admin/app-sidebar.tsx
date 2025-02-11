'use client'

import * as React from 'react'
import {
  Copyright,
  Earth,
  Image,
  ImageUp,
  Info,
  Frame,
  ServerCog,
  Milestone,
  RectangleEllipsis,
  SquareTerminal,
  ShieldCheck,
} from 'lucide-react'

import { NavMain } from '~/components/layout/admin/nav-main'
import { NavProjects } from '~/components/layout/admin/nav-projects'
import { NavUser } from '~/components/layout/admin/nav-user'
import { NavTitle } from '~/components/layout/admin/nav-title'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '~/components/ui/sidebar'
import { useRouter } from 'next-nprogress-bar'
import { useTranslations } from 'next-intl'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const t = useTranslations()

  const iconClasses = 'text-xl text-default-500 pointer-events-none flex-shrink-0'

  const data = {
    navMain: [
      {
        title: t('Link.dashboard'),
        url: "/admin",
        icon: SquareTerminal,
      },
      {
        title: t('Link.upload'),
        url: "/admin/upload",
        icon: ImageUp,
      },
      {
        title: t('Link.list'),
        url: "/admin/list",
        icon: Image,
      },
      {
        title: t('Link.album'),
        url: "/admin/album",
        icon: Milestone,
      },
      {
        title: t('Link.copyright'),
        url: "/admin/copyright",
        icon: Copyright,
      },
      {
        title: t('Link.about'),
        url: "/admin/about",
        icon: Info,
      },
    ],
    projects: {
      title: t('Link.settings'),
      items: [
        {
          name: t('Link.preferences'),
          url: "/admin/settings/preferences",
          icon: Frame,
        },
        {
          name: t('Link.account'),
          url: "/admin/settings/account",
          icon: ShieldCheck,
        },
        {
          name: t('Link.password'),
          url: "/admin/settings/password",
          icon: RectangleEllipsis,
        },
        {
          name: t('Link.storages'),
          url: "/admin/settings/storages",
          icon: ServerCog,
        },
        {
          name: t('Link.authenticator'),
          url: "/admin/settings/authenticator",
          icon: ShieldCheck,
        },
      ],
    },
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavTitle />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => router.push('/')}>
                <Earth size={20} className={iconClasses} />
                <span>{t('Login.goHome')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
