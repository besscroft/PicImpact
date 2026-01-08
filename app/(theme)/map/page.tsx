import { fetchMapImages } from '~/server/db/query/images'
import { MapView } from '~/components/layout/theme/map/map-view'
import { fetchConfigsByKeys } from '~/server/db/query/configs'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const data = await fetchConfigsByKeys(['custom_title'])
  const siteTitle = data?.find(item => item.config_key === 'custom_title')?.config_value || 'PicImpact'
  return {
    title: `Map | ${siteTitle}`,
  }
}

export default async function MapPage() {
  const images = await fetchMapImages()

  return (
    <div className="w-full h-screen">
      <MapView images={images} />
    </div>
  )
}
