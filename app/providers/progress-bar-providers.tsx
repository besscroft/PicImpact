'use client'

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'

export function ProgressBarProviders({children}: { children: React.ReactNode }) {
  return (
    <>
      <ProgressBar
        height="2px"
        color="#000000"
        shallowRouting
      />
      {children}
    </>
  )
}
