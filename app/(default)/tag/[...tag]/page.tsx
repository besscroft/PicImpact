import type { ImageHandleProps } from '~/types/props'
import { fetchClientImagesListByTag, fetchClientImagesPageTotalByTag } from '~/server/db/query/images'
import { getDisplayConfig } from '~/server/actions/images'
import { getVariantBaseUrl } from '~/server/lib/variant-storage'
import TagGallery from '~/components/album/tag-gallery'

import 'react-photo-album/masonry.css'

export default async function Label({params}: { params: any }) {
  const { tag } = await params
  const getData = async (pageNum: number, tag: string, _camera?: string, _lens?: string) => {
    'use server'
    // Tag gallery doesn't use camera/lens filters
    return await fetchClientImagesListByTag(pageNum, tag)
  }

  const getPageTotal = async (tag: string, _camera?: string, _lens?: string) => {
    'use server'
    // Tag gallery doesn't use camera/lens filters
    return await fetchClientImagesPageTotalByTag(tag)
  }

  // Server-resolved so the tag gallery serves AVIF on the first render (no
  // preview double-load while the client config SWR is still pending).
  const variantBaseUrl = await getVariantBaseUrl().catch(() => '')

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client-tag',
    album: `${decodeURIComponent(tag)}`,
    totalHandle: getPageTotal,
    configHandle: getDisplayConfig,
    variantBaseUrl,
  }

  return (
    <TagGallery {...props} />
  )
}