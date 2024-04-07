'use client'

import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'

export function ToasterProviders() {
  const { theme, setTheme } = useTheme()

  return (
    <Toaster richColors closeButton position="top-right" theme={ theme === 'light' ? 'light' : 'dark' } />
  )
}