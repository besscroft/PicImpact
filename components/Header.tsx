'use client'

import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link } from '@nextui-org/react'
import Logo from '~/components/Logo'
import DynamicNavbar from '~/components/DynamicNavbar'
import { useRouter } from 'next-nprogress-bar'

export default function Header() {
  const router = useRouter()

  return (
    <Navbar>
      <NavbarBrand>
        <Logo />
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4 select-none" justify="center">
        <NavbarItem onClick={() => router.push('/')} className="cursor-pointer">
          首页
        </NavbarItem>
        <NavbarItem onClick={() => router.push('/about')} className="cursor-pointer">
          关于
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="flex h-full items-center space-x-2">
          <DynamicNavbar />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}