'use client'

import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/react'
import Logo from '~/components/layout/Logo'
import DynamicNavbar from '~/components/layout/DynamicNavbar'
import { usePathname } from 'next/navigation'

export default function DashHeader() {
  const pathname = usePathname()

  return (
    <Navbar className={pathname.startsWith('/admin/settings/') ? 'hidden sm:flex' : 'flex'}>
      <NavbarBrand>
        <Logo />
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4 select-none" justify="center">
        控制台顶栏
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="flex h-full items-center space-x-2">
          <DynamicNavbar />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}