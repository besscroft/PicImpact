import { fetchImagesAnalysis } from '~/server/db/query/images'
import CardList from '~/components/admin/dashboard/card-list'
import type { AnalysisDataProps } from '~/types/props'

export default async function Admin() {
  const getData = async (): Promise<AnalysisDataProps> => {
    'use server'
    // @ts-ignore
    return await fetchImagesAnalysis()
  }

  const data = await getData()

  const props: AnalysisDataProps = {
    data: data,
  }

  return (
    <div className="flex flex-col mt-4 space-y-2">
      <CardList {...props} />
    </div>
  )
}