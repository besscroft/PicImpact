import {
  fetchServerImagesListByAlbum,
  fetchServerImagesPageTotalByAlbum
} from '~/server/db/query'
import { ImageServerHandleProps } from '~/types'
import ListProps from '~/components/admin/list/ListProps'

export default async function List() {
  const getData = async (pageNum: number, Album: string) => {
    'use server'
    return await fetchServerImagesListByAlbum(pageNum, Album)
  }

  const getTotal = async (Album: string) => {
    'use server'
    return await fetchServerImagesPageTotalByAlbum(Album)
  }

  const props: ImageServerHandleProps = {
    handle: getData,
    args: 'getImages-server',
    totalHandle: getTotal,
  }

  return (
    <ListProps {...props} />
  )
}