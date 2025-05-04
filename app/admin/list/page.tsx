import {
  fetchServerImagesListByAlbum,
  fetchServerImagesPageTotalByAlbum
} from '~/server/db/query/images'
import type { ImageServerHandleProps } from '~/types/props'
import ListProps from '~/components/admin/list/list-props'

export default async function List() {
  const getData = async (pageNum: number, Album: string, showStatus: number = -1) => {
    'use server'
    return await fetchServerImagesListByAlbum(pageNum, Album, showStatus)
  }

  const getTotal = async (Album: string, showStatus: number = -1) => {
    'use server'
    return await fetchServerImagesPageTotalByAlbum(Album, showStatus)
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