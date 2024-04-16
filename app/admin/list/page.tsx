import { fetchImagesList, fetchImagesTotal } from '~/server/lib/query'
import { HandleListProps } from '~/types'
import ListProps from '~/components/admin/list/ListProps'

export default async function List() {
  const getData = async (pageNum: number) => {
    'use server'
    return await fetchImagesList(pageNum)
  }

  const getTotal = async () => {
    'use server'
    return await fetchImagesTotal()
  }

  const props: HandleListProps = {
    handle: getData,
    args: 'getImages',
    totalHandle: getTotal,
  }

  return (
    <ListProps {...props} />
  )
}