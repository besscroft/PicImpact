import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/server/db/query/images'
import type { ImageHandleProps } from '~/types/props'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { fetchAlbumsList } from '~/server/db/query/albums'
import AlbumGallery from '~/components/album/album-gallery'

import 'react-photo-album/masonry.css'

export default async function Page({params}: { params: any }) {
  const { album } = await params

  const getData = async (pageNum: number, album: string) => {
    'use server'
    return await fetchClientImagesListByAlbum(pageNum, album)
  }

  const getPageTotal = async (album: string) => {
    'use server'
    return await fetchClientImagesPageTotalByAlbum(album)
  }

  const getConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_download_enable'
    ])
  }

  const albumData = await fetchAlbumsList()
  const currentAlbum = albumData.find(a => a.album_value === `/${album}`)

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: `/${album}`,
    totalHandle: getPageTotal,
    configHandle: getConfig,
    randomShow: currentAlbum?.randomShow === 1
  }

  return (
    <AlbumGallery {...props} />
  )
}