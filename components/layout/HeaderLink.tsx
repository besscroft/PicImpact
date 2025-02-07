'use client'

import { AlbumType } from '~/types'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next-nprogress-bar'
import { DataProps } from '~/types'
import { Button } from '~/components/ui/button'
import { useTranslations } from 'next-intl'

export default function HeaderLink(props: Readonly<DataProps>) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations()

  return (
    <>
      {Array.isArray(props.data) && props.data?.map((album: AlbumType) => (
        <Button
          variant="link"
          key={album.id}
          className={pathname === album.album_value ? 'border-b-2 border-indigo-600 rounded-none' : 'rounded-none'}
          onClick={() => router.push(album.album_value)}
          aria-label={album.name}
        >
          {album.album_value === '/' ? t('Link.home') : album.name}
        </Button>
      ))}
    </>
  )
}