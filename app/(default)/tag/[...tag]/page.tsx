import type { ImageHandleProps } from '~/types/props'
import { fetchClientImagesListByTag, fetchClientImagesPageTotalByTag } from '~/server/db/query/images'
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

  const getConfig = async () => {
    'use server'
    // 什么都不做
    console.log('')
  }

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client-tag',
    album: `${decodeURIComponent(tag)}`,
    totalHandle: getPageTotal,
    configHandle: getConfig
  }

  return (
    <TagGallery {...props} />
  )
}