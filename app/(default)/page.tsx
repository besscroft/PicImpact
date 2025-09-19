import type { ImageHandleProps } from '~/types/props'
import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/server/db/query/images'
import SimpleGallery from '~/components/layout/theme/simple/main/simple-gallery.tsx'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import DefaultGallery from '~/components/layout/theme/default/main/default-gallery.tsx'
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
      'custom_index_origin_enable'
    ])
  }

  const getStyleConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_style',
    ])
  }

  const style: Config[] = await getStyleConfig()
  const currentStyle = style.find(a => a.config_key === 'custom_index_style')?.config_value

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: '/',
    totalHandle: getPageTotal,
    configHandle: getConfig
  }

  return (
    <>
      {currentStyle
        && currentStyle === '1' ? <SimpleGallery {...props} />
        : <DefaultGallery {...props} />
      }
    </>
  )
}
