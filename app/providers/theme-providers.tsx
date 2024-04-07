'use client'

import { Theme } from '@radix-ui/themes'

export function ThemeProviders({children}: { children: React.ReactNode }) {
  return (
    <Theme
      panelBackground="translucent"
      scaling="100%"
      radius="small"
    >
      {children}
    </Theme>
  )
}