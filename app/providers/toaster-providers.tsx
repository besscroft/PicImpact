'use client'

import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

export function ToasterProviders() {
  const { theme } = useTheme()

  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      theme={ theme === 'light' ? 'light' : 'dark' }
      toastOptions={{
        className: 'z-[9999]',
      }}
    />
  )
}