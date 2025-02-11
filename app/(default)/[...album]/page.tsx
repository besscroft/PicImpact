import Masonry from '~/components/album/Masonry'
import {
  fetchClientImagesListByAlbum,
  fetchClientImagesPageTotalByAlbum,
} from '~/server/db/query'
import { ImageHandleProps } from '~/types'

export default async function Page({params}: { params: any }) {
  const { album } = await params

  const getData = async (pageNum: number, album: string) => {
    'use server'
    return await fetchClientImagesListByAlbum(pageNum, album)
  }

  const getPageTotal = async (album: string) => {
    'use server'
    return await fetchClientImagesPageTotalByAlbum(album)
  }

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: `/${album}`,
    totalHandle: getPageTotal,
  }

  return (
    <Masonry {...props} />
  )
}