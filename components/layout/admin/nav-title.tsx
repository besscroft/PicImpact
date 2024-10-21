'use client'

import * as React from 'react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'
import Image from 'next/image'
import favicon from '~/public/favicon.svg'
import { useRouter } from 'next-nprogress-bar'

export function NavTitle() {
  const router = useRouter()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" onClick={() => router.push('/')}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                <Image src={favicon} alt="Logo" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold select-none">
                  {'PicImpact'}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
