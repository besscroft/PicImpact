'use client'

import { LoaderPinwheelIcon } from '~/components/icons/loader-pinwheel'
import { GalleryThumbnailsIcon } from '~/components/icons/gallery-thumbnails'
import { CompassIcon } from '~/components/icons/compass'
import { useRouter } from 'next-nprogress-bar'

export default function HeaderIconGroup() {
  const router = useRouter()

  return (
    <div className="flex items-center space-x-1">
      <LoaderPinwheelIcon size={18} onClick={() => router.push('/')} />
      <GalleryThumbnailsIcon size={18} />
      <CompassIcon size={18} />
    </div>
  )
}