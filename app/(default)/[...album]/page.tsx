import Masonry from '~/components/album/Masonry'
import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/server/db/query'
import { ImageHandleProps } from '~/types'

export default async function Page({params}: { params: any }) {
  const { album } = await params
  const getData = async (pageNum: number, Album: string) => {
    'use server'
    return await fetchClientImagesListByAlbum(pageNum, Album)
  }

  const getPageTotal = async (Album: string) => {
    'use server'
    return await fetchClientImagesPageTotalByAlbum(Album)
  }

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: `/${album}`,
    totalHandle: getPageTotal
  }

  return (
    <Masonry {...props} />
  )
}