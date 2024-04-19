import {
  fetchServerImagesListByTag,
  fetchServerImagesPageTotalByTag
} from '~/server/lib/query'
import { ImageServerHandleProps } from '~/types'
import ListProps from '~/components/admin/list/ListProps'

export default async function List() {
  const getData = async (pageNum: number, tag: string) => {
    'use server'
    return await fetchServerImagesListByTag(pageNum, tag)
  }

  const getTotal = async (tag: string) => {
    'use server'
    return await fetchServerImagesPageTotalByTag(tag)
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