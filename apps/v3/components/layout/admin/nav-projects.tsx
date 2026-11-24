'use client'

import { AnimatedIconTrigger, type AnimatedIconComponent, mergeAnimatedTriggerProps } from '~/components/icons/animated-trigger'
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
      icon: AnimatedIconComponent
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
          <AnimatedIconTrigger key={item.name}>
            {({ iconRef, triggerProps }) => (
              <SidebarMenuItem>
                <SidebarMenuButton
                  {...mergeAnimatedTriggerProps({
                    className: buttonClasses,
                    tooltip: item.name,
                    isActive: pathname === item.url,
                    onClick: () => {
                      setOpenMobile(false)
                      router.push(item.url)
                    },
                  }, triggerProps)}
                >
                  <item.icon ref={iconRef} size={18} />
                  <span>{item.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </AnimatedIconTrigger>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
