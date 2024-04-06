'use client'

import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react'
import { useRouter } from 'next/navigation'

export const DropMenu = async () => {
  const router = useRouter()
  return (
    <Dropdown>
      <DropdownTrigger>
        <span className="cursor-pointer select-none px-2">
          菜单
        </span>
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions">
        <DropdownItem key="new" onClick={() => router.push('/admin')}>
          后台
        </DropdownItem>
        <DropdownItem key="copy" onClick={() => router.push('/')}>
          退出登录
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}