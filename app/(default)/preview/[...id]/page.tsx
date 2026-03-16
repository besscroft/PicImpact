import { fetchImageByIdAndAuth } from '~/server/db/query/images'
import type { PreviewImageHandleProps } from '~/types/props'
import PreviewImage from '~/components/album/preview-image'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import type { Metadata } from 'next/types'

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const { id } = await params
  const imageData = await fetchImageByIdAndAuth(String(id))

  if (!imageData) {
    return { title: 'Photo not found' }
  }

  const title = imageData.title || 'Photo'
  const description = [
    imageData.exif?.make,
    imageData.exif?.model,
    imageData.exif?.focal_length,
    imageData.exif?.f_number ?? null,
    imageData.exif?.iso_speed_rating ? `ISO ${imageData.exif.iso_speed_rating}` : null,
  ].filter(Boolean).join(' · ') || imageData.detail || title

  const imageUrl = imageData.preview_url || imageData.url

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: imageUrl ? [{ url: imageUrl, width: imageData.width, height: imageData.height, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

export default async function PreView({params}: { params: any }) {
  const { id } = await params

  const getData = async (id: string) => {
    'use server'
    return await fetchImageByIdAndAuth(String(id))
  }

  const getConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_download_enable'
    ])
  }

  const imageData = await getData(id)

  const props: PreviewImageHandleProps = {
    data: imageData,
    args: 'getImages-client-preview',
    id: id,
    configHandle: getConfig,
  }

  return (
    <PreviewImage {...props} />
  )
}
