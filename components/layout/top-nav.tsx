'use client'

import { useRouter } from 'next-nprogress-bar'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { useTheme } from 'next-themes'
import type { AlbumDataProps } from '~/types/props'
import type { AlbumType } from '~/types'
import Link from 'next/link'
import Command from '~/components/layout/command'
import { MapPin, Search, Sun, Moon } from 'lucide-react'

export default function TopNav(props: Readonly<AlbumDataProps>) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const { resolvedTheme, setTheme } = useTheme()
  const { setCommand } = useButtonStore(
    (state) => state,
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommand(true)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [setCommand])

  const isActiveTab = (albumValue: string) => {
    if (albumValue === '/') {
      return pathname === '/'
    }
    return pathname === albumValue
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-12">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50" />
        <nav className="relative flex h-12 items-center justify-between px-3 lg:px-4">
          {/* Left: Site logo/name */}
          <Link
            href="/"
            className="shrink-0 text-base font-semibold text-foreground hover:opacity-80 transition-opacity"
          >
            {props.title || 'PicImpact'}
          </Link>

          {/* Center: Album tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide mx-4">
            <Link
              href="/"
              className={`rounded-full px-3 py-1 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isActiveTab('/')
                  ? 'bg-primary/10 text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('Link.home')}
            </Link>
            {Array.isArray(props.data) && props.data.length > 0 &&
              props.data.map((album: AlbumType) => (
                <Link
                  key={album.id}
                  href={album.album_value}
                  className={`rounded-full px-3 py-1 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isActiveTab(album.album_value)
                      ? 'bg-primary/10 text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {album.name}
                </Link>
              ))
            }
          </div>

          {/* Right: Icon buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => router.push('/map')}
              className="inline-flex items-center justify-center rounded-md min-w-[44px] min-h-[44px] p-2 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('Link.map')}
            >
              <MapPin size={18} />
            </button>
            <button
              type="button"
              onClick={() => setCommand(true)}
              className="inline-flex items-center justify-center rounded-md min-w-[44px] min-h-[44px] p-2 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('Command.placeholder')}
            >
              <Search size={18} />
            </button>
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
              className="inline-flex items-center justify-center rounded-md min-w-[44px] min-h-[44px] p-2 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t(resolvedTheme === 'light' ? 'Button.dark' : 'Button.light')}
            >
              {resolvedTheme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </nav>
      </header>
      <Command {...props} />
    </>
  )
}
