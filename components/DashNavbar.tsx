'use client'

import { useBreakpoints } from '~/utils/useBreakpoints'
import { ThemeSwitch } from '~/components/DarkToggle'
import DashVaulDrawer from '~/components/DashVaulDrawer'
import { useHydrated } from '~/composables/react'
import { DashDropMenu } from '~/components/DashDropMenu'
import React from "react";

export default function DashNavbar() {
  const hydrated = useHydrated()
  const { smAndLarger } = useBreakpoints()

  return (
    <>
      <button
        className="flex items-center space-x-2 md:hidden"
      >
        <DashDropMenu/>
      </button>
      {/*{ hydrated ? smAndLarger ? <ThemeSwitch/> : <DashVaulDrawer/> : null }*/}
      {/*{ hydrated && smAndLarger && <DashDropMenu/> }*/}
    </>
  )
}