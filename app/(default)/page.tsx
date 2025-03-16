import Masonry from '~/components/album/Masonry'
import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum, fetchConfigsByKeys, fetchAlbumsList } from '~/server/db/query'
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

  const albumData = await fetchAlbumsList()
  const currentAlbum = albumData.find(a => a.album_value === '/')

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: '/',
    totalHandle: getPageTotal,
    configHandle: getConfig,
    randomShow: currentAlbum?.randomShow === 1
  }

  return (
    <Masonry {...props} />
  )
}
