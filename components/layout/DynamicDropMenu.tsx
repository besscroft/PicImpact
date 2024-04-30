'use client'

import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react'
import { useRouter } from 'next-nprogress-bar'
import { usePathname } from 'next/navigation'
import { Aperture } from 'lucide-react'
import { HandleProps, TagType } from '~/types'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'

export default function DynamicDropMenu(props: Readonly<HandleProps>) {
  const router = useRouter()
  const pathname = usePathname()
  const { data } = useSWRHydrated(props)

  return (
    <Dropdown shadow="sm" backdrop="blur">
      <DropdownTrigger>
        <Aperture size={20} />
      </DropdownTrigger>
      <DropdownMenu
        aria-label="移动端动态路由下拉菜单"
      >
        <DropdownItem
          key="/"
          onClick={() => router.push('/')}
          className={pathname === '/' ? 'text-blue-600' : ''}
        >
          首页
        </DropdownItem>
        {data && data?.map((tag: TagType, index: any, array: TagType[]) => (
          <DropdownItem
            key={tag.id}
            onClick={() => router.push(tag.tag_value)}
            className={pathname === tag.tag_value ? 'text-blue-600' : ''}
          >
            {tag.name}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}