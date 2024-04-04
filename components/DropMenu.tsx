'use client'

import React, { useEffect } from 'react'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@nextui-org/react'
import { useUserStore } from '~/app/providers/userStoreProvider'
import type { UserStore } from '~/stores/userStore'
import { useRouter } from 'next/navigation'

export const DropMenu = () => {
  const { token, setToken, removeToken } = useUserStore((state: UserStore) => state)
  const router = useRouter()

  useEffect(() => {
    setToken('666666')
  }, [])

  return (
    <>
      {
        token ?
          <Dropdown>
            <DropdownTrigger>
              <Button variant="light">
                菜单
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Static Actions">
              <DropdownItem key="new" onClick={() => router.push('/admin')}>后台</DropdownItem>
              <DropdownItem key="copy" onClick={() => { removeToken(); router.push('/') }}>退出登录</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          :
          <Button variant="light" onClick={() => router.push('/login')}>
            登录
          </Button>
      }
    </>
  )
}