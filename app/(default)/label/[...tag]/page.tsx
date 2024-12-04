import Masonry from '~/components/album/Masonry'
import { fetchClientImagesListByTag, fetchClientImagesPageTotalByTag } from '~/server/db/query'
import { ImageHandleProps } from '~/types'

export default async function Label({params}: { params: any }) {
  const { tag } = await params
  const getData = async (pageNum: number, tag: string) => {
    'use server'
    return await fetchClientImagesListByTag(pageNum, tag)
  }

  const getPageTotal = async (tag: string) => {
    'use server'
    return await fetchClientImagesPageTotalByTag(tag)
  }

  const props: ImageHandleProps = {
    handle: getData,
    args: `getImages-client-label`,
    album: `${decodeURIComponent(tag)}`,
    totalHandle: getPageTotal
  }

  return (
    <Masonry {...props} />
  )
}