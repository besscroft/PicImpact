'use client'

import { type LucideIcon } from 'lucide-react'
import { Collapsible } from '~/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next-nprogress-bar'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const buttonClasses = 'active:scale-95 duration-200 ease-in-out'

  return (
    <SidebarGroup>
      <SidebarGroupLabel>菜单</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <SidebarMenuButton className={buttonClasses} tooltip={item.title} isActive={pathname === item.url} onClick={() => router.push(item.url)}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
