import type { ImageHandleProps } from '~/types/props'
import { getImagesData, getImagesPageTotal, getDisplayConfig, initDailyIfNeeded } from '~/server/actions/images'
import SimpleGallery from '~/components/layout/theme/simple/simple-gallery.tsx'
import { cachedConfigsByKeys } from '~/server/lib/cache'
import { toCustomInfo } from '~/server/lib/config-transform'
import DefaultGallery from '~/components/layout/theme/default/default-gallery.tsx'
import PolaroidGallery from '~/components/layout/theme/polaroid/polaroid-gallery.tsx'

export default async function Home() {
  await initDailyIfNeeded()

  const getStyleConfig = async () => {
    'use server'
    const rows = await cachedConfigsByKeys(['custom_index_style'])
    return toCustomInfo(rows).customIndexStyle
  }

  const currentStyle = await getStyleConfig()

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
