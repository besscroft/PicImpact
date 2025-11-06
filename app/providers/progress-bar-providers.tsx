'use client'

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'
import React from 'react'

export function ProgressBarProviders({children}: { children: React.ReactNode }) {
  return (
    <>
      <ProgressBar
        height="2px"
        color="oklch(87.2% 0.01 258.338)"
        shallowRouting
      />
      {children}
    </>
  )
}
