'use client'

import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react'
import Link from 'next/link'
import { loginOut } from '~/server/lib/actions'

export const DashDropMenu = async () => {
  return (
    <Dropdown>
      <DropdownTrigger>
        <span className="cursor-pointer select-none px-2">
          菜单
        </span>
      </DropdownTrigger>
      <DropdownMenu aria-label="下拉菜单">
        <DropdownItem key="admin">
          <Link href="/admin">
            后台
          </Link>
        </DropdownItem>
        <DropdownItem key="loginOut">
          <div onClick={async () => {
            await loginOut()
          }}>
            退出登录
          </div>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}