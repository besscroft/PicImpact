'use client'

import { type LucideIcon } from 'lucide-react'
import { Collapsible } from '~/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar'
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
  const router = useRouter()
  const pathname = usePathname()
  const buttonClasses = 'active:scale-95 duration-200 ease-in-out cursor-pointer'
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="select-none">菜单</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            className="group/collapsible"
          >
            <SidebarMenuItem className="select-none">
              <SidebarMenuButton
                className={buttonClasses}
                tooltip={item.title}
                isActive={pathname === item.url}
                onClick={() => {
                  setOpenMobile(false)
                  router.push(item.url)
                }}>
                {item.icon && <item.icon size={18} />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
