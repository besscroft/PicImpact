import Masonry from '~/components/Masonry'
import { fetchClientImagesListByLabel, fetchClientImagesPageTotalByLabel } from '~/server/lib/query'
import { ImageHandleProps } from '~/types'

export default function Label({ params }: { params: { tag: string } }) {
  const getData = async (pageNum: number, tag: string) => {
    'use server'
    return await fetchClientImagesListByLabel(pageNum, tag)
  }

  const getPageTotal = async (tag: string) => {
    'use server'
    return await fetchClientImagesPageTotalByLabel(tag)
  }

  const props: ImageHandleProps = {
    handle: getData,
    args: `getImages-client-label`,
    tag: `${decodeURIComponent(params.tag)}`,
    totalHandle: getPageTotal
  }

  return (
    <Masonry {...props} />
  )
}