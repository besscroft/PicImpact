import { fetchImagesAnalysis } from '~/server/db/query'
import CardList from '~/components/admin/dashboard/CardList'
import { DataProps } from '~/types'

export default async function Admin() {
  const getData = async (): Promise<{
    total: number
    showTotal: number
    crTotal: number
    tagsTotal: number
    result: any[]
  }> => {
    'use server'
    // @ts-ignore
    return await fetchImagesAnalysis()
  }

  const data = await getData()

  const props: DataProps = {
    data: data,
  }

  return (
    <div className="flex flex-col mt-4 space-y-2">
      <CardList {...props} />
    </div>
  )
}