import Masonry from '~/components/album/Masonry'
import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum, fetchConfigsByKeys } from '~/server/db/query'
import { ImageHandleProps } from '~/types'

export default async function Home() {
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

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: '/',
    totalHandle: getPageTotal,
    configHandle: getConfig
  }

  return (
    <Masonry {...props} />
  )
}
