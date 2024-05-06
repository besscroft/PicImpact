import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/react'
import Logo from '~/components/layout/Logo'
import DynamicNavbar from '~/components/layout/DynamicNavbar'
import HeaderLink from '~/components/layout/HeaderLink'
import { fetchTagsShow } from '~/server/lib/query'
import { DataProps } from '~/types'

export default async function Header() {
  const getData = async () => {
    'use server'
    return await fetchTagsShow()
  }

  const data = await getData()

  const props: DataProps = {
    data: data
  }

  return (
    <Navbar>
      <NavbarBrand>
        <Logo/>
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-1 select-none" justify="center">
        <HeaderLink {...props} />
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem className="flex h-full items-center space-x-2">
          <DynamicNavbar/>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}