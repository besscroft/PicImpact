'use client'

import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'
import { useIsHydrated } from '~/hooks/use-is-hydrated'

type ToasterProps = React.ComponentProps<typeof Toaster>

export function ToasterProviders() {
  const { theme = 'system' } = useTheme()
  const isHydrated = useIsHydrated()

  return (
    <Toaster
      richColors
      closeButton
      position="bottom-right"
      theme={(isHydrated ? theme : 'system') as ToasterProps['theme']}
    />
  )
}
