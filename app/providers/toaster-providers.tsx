'use client'

import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

type ToasterProps = React.ComponentProps<typeof Toaster>

export function ToasterProviders() {
  const { theme = 'system' } = useTheme()

  return (
    <Toaster
      richColors
      closeButton
      position="bottom-right"
      theme={ theme as ToasterProps['theme'] }
    />
  )
}