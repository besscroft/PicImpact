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

const data = {
  navMain: [
    {
      title: "控制台",
      url: "/admin",
      icon: SquareTerminal,
    },
    {
      title: "上传",
      url: "/admin/upload",
      icon: ImageUp,
    },
    {
      title: "图片维护",
      url: "/admin/list",
      icon: Image,
    },
    {
      title: "相册管理",
      url: "/admin/album",
      icon: Milestone,
    },
    {
      title: "版权管理",
      url: "/admin/copyright",
      icon: Copyright,
    },
    {
      title: "关于",
      url: "/admin/about",
      icon: Info,
    },
  ],
  projects: {
    title: '设置',
    items: [
      {
        name: "首选项",
        url: "/admin/settings/preferences",
        icon: Frame,
      },
      {
        name: "密码修改",
        url: "/admin/settings/password",
        icon: RectangleEllipsis ,
      },
      {
        name: "存储配置",
        url: "/admin/settings/storages",
        icon: ServerCog,
      },
      {
        name: "双因素验证",
        url: "/admin/settings/authenticator",
        icon: ShieldCheck,
      },
    ],
  },
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const iconClasses = 'text-xl text-default-500 pointer-events-none flex-shrink-0'

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
                <span>回到首页</span>
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
