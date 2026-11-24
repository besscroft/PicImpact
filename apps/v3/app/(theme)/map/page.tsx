import { fetchMapImages } from '~/server/db/query/images'
import { MapView } from '~/components/layout/theme/map/map-view'
import { cachedConfigsByKeys } from '~/server/lib/cache'
import { toCustomInfo } from '~/server/lib/config-transform'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const rows = await cachedConfigsByKeys(['custom_title'])
  const siteTitle = toCustomInfo(rows).customTitle || 'PicImpact'
  return {
    title: `Map | ${siteTitle}`,
  }
}

export default async function MapPage() {
  const images = await fetchMapImages()

  return (
    <div className="h-[calc(100dvh-3rem)] w-full overflow-hidden">
      <MapView images={images} />
    </div>
  )
}
