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
      'custom_index_random_show'
    ])
  }

  const configData = await getConfig()
  const value = configData[0]?.config_value ?? 'false'

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: '/',
    totalHandle: getPageTotal,
    configHandle: getConfig,
    randomShow: value === 'true'
  }

  return (
    <Masonry {...props} />
  )
}
