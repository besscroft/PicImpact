'use client'

import { AnimatedIconTrigger, type AnimatedIconComponent, mergeAnimatedTriggerProps } from '~/components/icons/animated-trigger'
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
    icon?: AnimatedIconComponent
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
          <AnimatedIconTrigger key={item.title}>
            {({ iconRef, triggerProps }) => (
              <Collapsible
                asChild
                className="group/collapsible"
              >
                <SidebarMenuItem className="select-none">
                  <SidebarMenuButton
                    {...mergeAnimatedTriggerProps({
                      className: buttonClasses,
                      tooltip: item.title,
                      isActive: pathname === item.url,
                      onClick: () => {
                        setOpenMobile(false)
                        router.push(item.url)
                      },
                    }, triggerProps)}
                  >
                    {item.icon && <item.icon ref={iconRef} size={18} />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Collapsible>
            )}
          </AnimatedIconTrigger>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
