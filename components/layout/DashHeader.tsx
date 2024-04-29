import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/react'
import Logo from '~/components/layout/Logo'
import DynamicNavbar from '~/components/layout/DynamicNavbar'

export default function DashHeader() {
  return (
    <Navbar isBordered>
      <NavbarBrand>
        <Logo />
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4 select-none" justify="center">
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="flex h-full items-center space-x-2">
          <DynamicNavbar />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}