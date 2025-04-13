'use client'

import { type LucideIcon } from 'lucide-react'
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

export function NavProjects({
  projects,
}: {
  projects: {
    title: string
    items?: {
      name: string
      url: string
      icon: LucideIcon
    }[]
  }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const buttonClasses = 'active:scale-95 duration-200 ease-in-out cursor-pointer'
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="select-none">{projects.title}</SidebarGroupLabel>
      <SidebarMenu className="select-none">
        {projects?.items?.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton
              className={buttonClasses}
              asChild
              isActive={pathname === item.url}
              onClick={() => {
                setOpenMobile(false)
                router.push(item.url)
              }}>
              <a href={item.url}>
                <item.icon size={18} />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
