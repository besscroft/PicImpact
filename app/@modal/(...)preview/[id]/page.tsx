import { fetchImageByIdAndAuth } from '~/server/db/query/images'
import PhotoViewer from '~/components/viewer/photo-viewer'

export default async function Page({params}: { params: any }) {
  const { id } = await params

  const imageData = await fetchImageByIdAndAuth(String(id))

  if (!imageData) {
    return null
  }

  return <PhotoViewer photo={imageData} />
}
