'use client'

import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react'
import Link from 'next/link'

export const DashDropMenu = async () => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <span className="cursor-pointer select-none px-2">
          菜单
        </span>
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions">
        <DropdownItem key="new">
          <Link href="/admin">
            后台
          </Link>
        </DropdownItem>
        <DropdownItem key="copy">
          <Link href="/">
            退出登录
          </Link>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}