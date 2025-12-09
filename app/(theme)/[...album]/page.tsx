import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/server/db/query/images.ts'
import type { ImageHandleProps } from '~/types/props.ts'
import { fetchConfigsByKeys } from '~/server/db/query/configs.ts'
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

  const getData = async (pageNum: number, album: string, camera?: string, lens?: string) => {
    'use server'
    return await fetchClientImagesListByAlbum(pageNum, album, camera, lens)
  }

  const getPageTotal = async (album: string, camera?: string, lens?: string) => {
    'use server'
    return await fetchClientImagesPageTotalByAlbum(album, camera, lens)
  }

  const getConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_download_enable'
    ])
  }

  const getAlbum = async (album: string) => {
    'use server'
    return await fetchAlbumByRouter(album)
  }

  const data: AlbumType = await getAlbum(`/${album}`)

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: `/${album}`,
    totalHandle: getPageTotal,
    configHandle: getConfig
  }

  return (
    <>
      {data
      && data.theme === '1' ? <SimpleGallery {...props} />
        : data.theme === '2' ? <PolaroidGallery {...props} />
        : <DefaultGallery {...props} />
      }
    </>
  )
}