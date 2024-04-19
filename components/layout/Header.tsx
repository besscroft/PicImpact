import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/react'
import Logo from '~/components/layout/Logo'
import DynamicNavbar from '~/components/layout/DynamicNavbar'
import HeaderLink from '~/components/layout/HeaderLink'

export default function Header() {
  return (
    <Navbar>
      <NavbarBrand>
        <Logo />
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4 select-none" justify="center">
        <HeaderLink />
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="flex h-full items-center space-x-2">
          <DynamicNavbar />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}