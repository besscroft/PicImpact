'use client'

import { Theme, ThemePanel } from '@radix-ui/themes'

export function ThemeProviders({children}: { children: React.ReactNode }) {
  return (
    <Theme
      panelBackground="translucent"
      scaling="100%"
    >
      {children}
      <ThemePanel />
    </Theme>
  )
}