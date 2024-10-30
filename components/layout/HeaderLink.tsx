'use client'

import { Button } from '@nextui-org/react'
import { AlbumType } from '~/types'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next-nprogress-bar'
import { DataProps } from '~/types'

export default function HeaderLink(props: Readonly<DataProps>) {
  const pathname = usePathname()
  const router = useRouter()
  return (
    <>
      <Button
        color="primary"
        radius="none"
        variant="light"
        className={pathname === '/' ? 'border-b-2 border-indigo-600' : ''}
        onClick={() => router.push('/')}
        aria-label="首页"
      >
        首页
      </Button>
      {Array.isArray(props.data) && props.data?.map((album: AlbumType) => (
        <Button
          key={a.id}
          color="primary"
          radius="none"
          variant="light"
          className={pathname === album.album_value ? 'border-b-2 border-indigo-600' : ''}
          onClick={() => router.push(album.album_value)}
          aria-label={album.name}
        >
          {album.name}
        </Button>
      ))}
    </>
  )
}