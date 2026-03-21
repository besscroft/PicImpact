import type { ImageHandleProps } from '~/types/props'
import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/server/db/query/images'
import SimpleGallery from '~/components/layout/theme/simple/simple-gallery.tsx'
import { fetchConfigsByKeys, fetchConfigValue } from '~/server/db/query/configs'
import DefaultGallery from '~/components/layout/theme/default/default-gallery.tsx'
import type { Config } from '~/types'
import PolaroidGallery from '~/components/layout/theme/polaroid/polaroid-gallery.tsx'
import { fetchDailyImagesList, fetchDailyImagesPageTotal } from '~/server/db/query/daily'
import { checkAndRefreshDailyImages } from '~/server/db/operate/daily'

export default async function Home() {
  const dailyEnabled = await fetchConfigValue('daily_enabled', 'false')
  if (dailyEnabled === 'true') {
    await checkAndRefreshDailyImages()
  }

  const getData = async (pageNum: number, album: string, camera?: string, lens?: string) => {
    'use server'
    const isDailyEnabled = await fetchConfigValue('daily_enabled', 'false')
    if (isDailyEnabled === 'true') {
      return await fetchDailyImagesList(pageNum, camera, lens)
    }
    return await fetchClientImagesListByAlbum(pageNum, album, camera, lens)
  }

  const getPageTotal = async (album: string, camera?: string, lens?: string) => {
    'use server'
    const isDailyEnabled = await fetchConfigValue('daily_enabled', 'false')
    if (isDailyEnabled === 'true') {
      return await fetchDailyImagesPageTotal(camera, lens)
    }
    return await fetchClientImagesPageTotalByAlbum(album, camera, lens)
  }

  const getConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_download_enable',
      'custom_index_origin_enable',
      'custom_title'
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
        : currentStyle === '2' ? <PolaroidGallery {...props} />
        : <DefaultGallery {...props} />
      }
    </>
  )
}
