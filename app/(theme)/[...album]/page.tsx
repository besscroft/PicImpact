import { getImagesData, getImagesPageTotal, getAlbumDisplayConfig } from '~/server/actions/images'
import { getVariantBaseUrl } from '~/server/lib/variant-storage'
import type { ImageHandleProps } from '~/types/props'
import DefaultGallery from '~/components/layout/theme/default/default-gallery'
import { cachedAlbumByRouter } from '~/server/lib/cache'
import 'react-photo-album/masonry.css'
import type { AlbumType, ImageType } from '~/types'
import SimpleGallery from '~/components/layout/theme/simple/simple-gallery'
import PolaroidGallery from '~/components/layout/theme/polaroid/polaroid-gallery'
import GalleryPreloadHints from '~/components/gallery/gallery-preload-hints'
import { gridSizesForTheme } from '~/lib/image/grid-image-sizes'

export default async function Page({
  params
}: {
  params: Promise<{ album: string }>
}) {
  const { album } = await params

  const data: AlbumType = await cachedAlbumByRouter(`/${album}`)

  // Server-side data for the LCP preload hint: the album's first image and the
  // variant CDN base. Best-effort — a failure here must never break the page.
  const [firstPage, variantBaseUrl] = await Promise.all([
    getImagesData(1, `/${album}`).catch(() => [] as ImageType[]),
    getVariantBaseUrl().catch(() => ''),
  ])

  const props: ImageHandleProps = {
    handle: getImagesData,
    args: 'getImages-client',
    album: `/${album}`,
    totalHandle: getImagesPageTotal,
    configHandle: getAlbumDisplayConfig,
    // Server-resolved so the gallery serves AVIF on the first render (no
    // preview double-load while the client config SWR is still pending).
    variantBaseUrl,
  }

  if (!data) {
    return <DefaultGallery {...props} />
  }

  return (
    <>
      <GalleryPreloadHints
        image={firstPage[0]}
        variantBaseUrl={variantBaseUrl}
        sizes={gridSizesForTheme(data.theme)}
      />
      {data.theme === '1' ? <SimpleGallery {...props} />
        : data.theme === '2' ? <PolaroidGallery {...props} />
        : <DefaultGallery {...props} />
      }
    </>
  )
}
