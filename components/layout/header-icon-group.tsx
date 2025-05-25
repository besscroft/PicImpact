'use client'

import { LoaderPinwheelIcon } from '~/components/icons/loader-pinwheel'
import { GalleryThumbnailsIcon } from '~/components/icons/gallery-thumbnails'
import { CompassIcon } from '~/components/icons/compass'
import { useRouter } from 'next-nprogress-bar'
import { useButtonStore } from '~/app/providers/button-store-providers'
import Command from '~/components/layout/command'
import type { AlbumDataProps } from '~/types/props'
import { useEffect } from 'react'

export default function HeaderIconGroup(props: Readonly<AlbumDataProps>) {
  const router = useRouter()
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

  return (
    <>
      <div className="flex items-center space-x-1">
        <LoaderPinwheelIcon size={18} onClick={() => router.push('/')} />
        {Array.isArray(props.data) && props.data.length > 0 &&
          <GalleryThumbnailsIcon onClick={() => router.push(props.data[0].album_value ?? '/')} size={18} />}
        <CompassIcon onClick={() => setCommand(true)} size={18} />
      </div>
      <Command {...props} />
    </>
  )
}