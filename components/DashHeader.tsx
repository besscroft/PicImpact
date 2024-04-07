import { Link, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/react'
import Logo from '~/components/Logo'
import {GithubIcon} from '~/style/icons/GitHub'
import DashNavbar from '~/components/DashNavbar'
import React from 'react'

export default function DashHeader() {
  return (
    <Navbar>
      <NavbarBrand>
        <Logo/>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4 select-none" justify="center">
        后台顶栏
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="flex h-full items-center">
          <Link
            isExternal
            aria-label="Github"
            className="p-1"
            href="https://github.com/besscroft/PicImpact"
          >
            <GithubIcon className="text-default-600 dark:text-white" />
          </Link>
        </NavbarItem>
        <NavbarItem className="flex h-full items-center space-x-2">
          <DashNavbar />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}