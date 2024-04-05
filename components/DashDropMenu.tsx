'use client'

import React from 'react'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import { getSession } from '~/utils/lib/session'

export const DashDropMenu = async () => {
  const router = useRouter()
  const session = await getSession()

  return (
    <>
      {
        session ?
          <Dropdown>
            <DropdownTrigger>
              <span className="cursor-pointer select-none px-2">
                菜单
              </span>
            </DropdownTrigger>
            <DropdownMenu aria-label="Static Actions">
              <DropdownItem key="new" onClick={() => router.push('/admin')}>后台</DropdownItem>
              <DropdownItem key="copy" onClick={() => {
                router.push('/')
              }}>退出登录</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          :
          <div className="cursor-pointer select-none" onClick={() => router.push('/login')}>
            登录
          </div>
      }
    </>
  )
}