import type { ImageHandleProps } from '~/types/props'
import { getImagesData, getImagesPageTotal, getDisplayConfig, initDailyIfNeeded } from '~/server/actions/images'
import SimpleGallery from '~/components/layout/theme/simple/simple-gallery.tsx'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import DefaultGallery from '~/components/layout/theme/default/default-gallery.tsx'
import type { Config } from '~/types'
import PolaroidGallery from '~/components/layout/theme/polaroid/polaroid-gallery.tsx'

export default async function Home() {
  await initDailyIfNeeded()

  const getStyleConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_style',
    ])
  }

  const style: Config[] = await getStyleConfig()
  const currentStyle = style.find(a => a.config_key === 'custom_index_style')?.config_value

  const props: ImageHandleProps = {
    handle: getImagesData,
    args: 'getImages-client',
    album: '/',
    totalHandle: getImagesPageTotal,
    configHandle: getDisplayConfig
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
