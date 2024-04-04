import React from 'react'
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, Link } from '@nextui-org/react'
import Logo from '~/components/Logo'
import DynamicNavbar from '~/components/DynamicNavbar'
import { GithubIcon } from '~/style/icons/GitHub'

export default function Header() {
  return (
    <Navbar>
      <NavbarBrand>
        <Logo />
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4 select-none" justify="center">
        <NavbarItem>
          <Link color="foreground" href="/">
            首页
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="/about">
            关于
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="flex h-full items-center">
          <Link
            isExternal
            aria-label="Github"
            className="p-1"
            href="https://github.com/besscroft/PicImpact"
          >
            <GithubIcon className="text-default-600 dark:text-default-500 dark:text-white" />
          </Link>
        </NavbarItem>
        <NavbarItem className="flex h-full items-center space-x-2">
          <DynamicNavbar />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}