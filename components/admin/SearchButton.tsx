'use client'

import { Search } from 'lucide-react'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { usePathname } from 'next/navigation'

export default function SearchButton() {
  const pathname = usePathname()
  const { setSearchOpen } = useButtonStore(
    (state) => state,
  )

  return (
    <>
      {
        pathname.startsWith('/admin') && <Search onClick={() => setSearchOpen(true)} size={20} />
      }
    </>
  )
}