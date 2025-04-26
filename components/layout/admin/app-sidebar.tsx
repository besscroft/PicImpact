'use client'

import * as React from 'react'
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
import { SquareTerminalIcon } from '~/components/icons/square-terminal'
import { UploadIcon } from '~/components/icons/upload'
import { LayersIcon } from '~/components/icons/layers'
import { GalleryThumbnailsIcon } from '~/components/icons/gallery-thumbnails'
import { GithubIcon } from '~/components/icons/github'
import { FrameIcon } from '~/components/icons/frame'
import { ShieldCheckIcon } from '~/components/icons/shield-check'
import { KeyCircleIcon } from '~/components/icons/key-circle'
import { CogIcon } from '~/components/icons/cog'
import { FingerprintIcon } from '~/components/icons/fingerprint'
import { LoaderPinwheelIcon } from '~/components/icons/loader-pinwheel'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const t = useTranslations()

  const data = {
    navMain: [
      {
        title: t('Link.dashboard'),
        url: '/admin',
        icon: SquareTerminalIcon,
      },
      {
        title: t('Link.upload'),
        url: '/admin/upload',
        icon: UploadIcon,
      },
      {
        title: t('Link.list'),
        url: '/admin/list',
        icon: LayersIcon,
      },
      {
        title: t('Link.album'),
        url: '/admin/album',
        icon: GalleryThumbnailsIcon,
      },
      {
        title: t('Link.about'),
        url: '/admin/about',
        icon: GithubIcon,
      },
    ],
    projects: {
      title: t('Link.settings'),
      items: [
        {
          name: t('Link.preferences'),
          url: '/admin/settings/preferences',
          icon: FrameIcon,
        },
        {
          name: t('Link.account'),
          url: '/admin/settings/account',
          icon: ShieldCheckIcon,
        },
        {
          name: t('Link.password'),
          url: '/admin/settings/password',
          icon: KeyCircleIcon,
        },
        {
          name: t('Link.storages'),
          url: '/admin/settings/storages',
          icon: CogIcon,
        },
        {
          name: t('Link.authenticator'),
          url: '/admin/settings/authenticator',
          icon: FingerprintIcon,
        },
      ],
    },
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavTitle />
      </SidebarHeader>
      <SidebarContent className="select-none">
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem className="select-none">
              <SidebarMenuButton className="cursor-pointer" onClick={() => router.push('/')}>
                <LoaderPinwheelIcon size={18} />
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
