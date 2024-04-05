'use client'

import { useBreakpoints } from '~/utils/useBreakpoints'
import { ThemeSwitch } from '~/components/DarkToggle'
import VaulDrawer from '~/components/VaulDrawer'
import { useHydrated } from '~/composables/react'
import { DropMenu } from '~/components/DropMenu'

export default function DynamicNavbar() {
  const hydrated = useHydrated()
  const { smAndLarger } = useBreakpoints()

  return (
    <>
      { hydrated ? smAndLarger ? <ThemeSwitch/> : <VaulDrawer/> : null }
      { hydrated && smAndLarger && <DropMenu/> }
    </>
  )
}