import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/react'
import Logo from '~/components/Logo'
import DynamicNavbar from '~/components/DynamicNavbar'
import Link from 'next/link'

export default function Header() {
  return (
    <Navbar>
      <NavbarBrand>
        <Logo />
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4 select-none" justify="center">
        <NavbarItem className="cursor-pointer">
          <Link href="/">首页</Link>
        </NavbarItem>
        <NavbarItem className="cursor-pointer">
          <Link href="/about">关于</Link>
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