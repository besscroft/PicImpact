import type { ImageHandleProps } from '~/types/props'
import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/server/db/query/images'
import Gallery from '~/components/album/gallery'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import AlbumGallery from '~/components/album/album-gallery'
import 'react-photo-album/masonry.css'
import type { Config } from '~/types'

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
      'custom_index_download_enable',
    ])
  }

  const getStyleConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_style',
    ])
  }

  const style: Config[] = await getStyleConfig()
  const currentStyle = style?.find(a => a.config_key === 'custom_index_style').config_value

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: '/',
    totalHandle: getPageTotal,
    configHandle: getConfig
  }

  return (
    <>
      {currentStyle && currentStyle === '1' ?
        <Gallery {...props} /> : <AlbumGallery {...props} />
      }
    </>
  )
}
