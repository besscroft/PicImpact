import type { ImageHandleProps } from '~/types/props'
import type { ImageType } from '~/types'
import { getImagesData, getImagesPageTotal, getDisplayConfig, initDailyIfNeeded } from '~/server/actions/images'
import { getVariantBaseUrl } from '~/server/lib/variant-storage'
import SimpleGallery from '~/components/layout/theme/simple/simple-gallery.tsx'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { toCustomInfo } from '~/server/lib/config-transform'
import DefaultGallery from '~/components/layout/theme/default/default-gallery.tsx'
import PolaroidGallery from '~/components/layout/theme/polaroid/polaroid-gallery.tsx'
import GalleryPreloadHints from '~/components/gallery/gallery-preload-hints'
import { gridSizesForTheme } from '~/lib/image/grid-image-sizes'

export default async function Home() {
  await initDailyIfNeeded()

  const getStyleConfig = async () => {
    'use server'
    const rows = await fetchConfigsByKeys(['custom_index_style'])
    return toCustomInfo(rows).customIndexStyle
  }

  const currentStyle = await getStyleConfig()

  // Server-side data for the LCP preload hint: the first gallery image and the
  // variant CDN base. Best-effort — a failure here must never break the page.
  const [firstPage, variantBaseUrl] = await Promise.all([
    getImagesData(1, '/').catch(() => [] as ImageType[]),
    getVariantBaseUrl().catch(() => ''),
  ])

  const props: ImageHandleProps = {
    handle: getImagesData,
    args: 'getImages-client',
    album: '/',
    totalHandle: getImagesPageTotal,
    configHandle: getDisplayConfig
  }

  return (
    <>
      <GalleryPreloadHints
        image={firstPage[0]}
        variantBaseUrl={variantBaseUrl}
        sizes={gridSizesForTheme(currentStyle)}
      />
      {currentStyle
        && currentStyle === '1' ? <SimpleGallery {...props} />
        : currentStyle === '2' ? <PolaroidGallery {...props} />
        : <DefaultGallery {...props} />
      }
    </>
  )
}
