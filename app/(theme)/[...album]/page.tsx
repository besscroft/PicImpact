import { getImagesData, getImagesPageTotal, getAlbumDisplayConfig } from '~/server/actions/images'
import type { ImageHandleProps } from '~/types/props.ts'
import DefaultGallery from '~/components/layout/theme/default/default-gallery.tsx'
import { fetchAlbumByRouter } from '~/server/db/query/albums.ts'
import 'react-photo-album/masonry.css'
import type { AlbumType } from '~/types'
import SimpleGallery from '~/components/layout/theme/simple/simple-gallery.tsx'
import PolaroidGallery from '~/components/layout/theme/polaroid/polaroid-gallery.tsx'

export default async function Page({
  params
}: {
  params: Promise<{ album: string }>
}) {
  const { album } = await params

  const data: AlbumType = await fetchAlbumByRouter(`/${album}`)

  const props: ImageHandleProps = {
    handle: getImagesData,
    args: 'getImages-client',
    album: `/${album}`,
    totalHandle: getImagesPageTotal,
    configHandle: getAlbumDisplayConfig
  }

  if (!data) {
    return <DefaultGallery {...props} />
  }

  return (
    <>
      {data.theme === '1' ? <SimpleGallery {...props} />
        : data.theme === '2' ? <PolaroidGallery {...props} />
        : <DefaultGallery {...props} />
      }
    </>
  )
}
