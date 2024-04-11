import { Card, CardHeader } from '@nextui-org/card'
import { fetchImagesList } from '~/server/lib/query'
import RefreshButton from '~/components/RefreshButton'

export default async function List() {
  const getData = async () => {
    'use server'
    const data = await fetchImagesList()
    return data
  }

  const data = await getData();

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Card>
        <CardHeader className="justify-between">
          <div className="flex gap-5">
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-semibold leading-none text-default-600 select-none">标签管理</h4>
            </div>
          </div>
          <RefreshButton handleClick={getData} />
        </CardHeader>
      </Card>
    </div>
  )
}