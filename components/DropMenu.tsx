'use client'

import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import { loginOut } from '~/server/lib/actions'

export const DropMenu = async () => {
  const router = useRouter()
  return (
    <Dropdown>
      <DropdownTrigger>
        <span className="cursor-pointer select-none px-2">
          菜单
        </span>
      </DropdownTrigger>
      <DropdownMenu aria-label="下拉菜单">
        <DropdownItem key="admin" onClick={() => router.push('/admin')}>
          后台
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