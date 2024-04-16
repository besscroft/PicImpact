import { fetchImagesList, fetchImagesTotal } from '~/server/lib/query'
import { HandleListProps } from '~/types'
import ListProps from '~/components/admin/list/ListProps'

export default async function List() {
  const getData = async (pageNum: number) => {
    'use server'
    return await fetchImagesList(pageNum)
  }

  const data = await getData(1)

  const getTotal = async () => {
    'use server'
    return await fetchImagesTotal()
  }

  const total = await getTotal()

  const props: HandleListProps = {
    handle: getData,
    args: 'getImages',
    totalHandle: getTotal,
    data: data,
    total: total
  }

  return (
    <ListProps {...props} />
  )
}