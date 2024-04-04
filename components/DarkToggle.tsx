'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { MoonFilledIcon, SunFilledIcon } from '@nextui-org/shared-icons'

export const ThemeSwitch= () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if(!mounted) return null

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? <SunFilledIcon height={24} width={24} /> : <MoonFilledIcon height={24} width={24}  />}
    </button>
  );
};