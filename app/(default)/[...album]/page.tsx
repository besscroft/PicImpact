import Masonry from '~/components/Masonry'
import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/server/db/query'
import { ImageHandleProps } from '~/types'

export default function Page({ params }: { params: { album: string } }) {
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
    album: `/${params.album}`,
    totalHandle: getPageTotal
  }

  return (
    <Masonry {...props} />
  )
}