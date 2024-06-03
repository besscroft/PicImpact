import { fetchCopyrightList } from '~/server/lib/query'
import { HandleProps } from '~/types'
import { Card, CardHeader } from '@nextui-org/react'
import React from 'react'
import CopyrightList from '~/components/admin/copyright/CopyrightList'
import CopyrightAddButton from '~/components/admin/copyright/CopyrightAddButton'
import RefreshButton from '~/components/RefreshButton'
import CopyrightAddSheet from '~/components/admin/copyright/CopyrightAddSheet'
import CopyrightEditSheet from '~/components/admin/copyright/CopyrightEditSheet'

export default async function Copyright() {
  const getData = async () => {
    'use server'
    return await fetchCopyrightList()
  }

  const props: HandleProps = {
    handle: getData,
    args: 'getCopyright',
  }

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <Card shadow="sm">
        <CardHeader className="justify-between">
          <div className="flex gap-5">
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-semibold leading-none text-default-600 select-none">相册管理</h4>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <CopyrightAddButton />
            <RefreshButton {...props} />
          </div>
        </CardHeader>
      </Card>
      <CopyrightList {...props} />
      <CopyrightAddSheet {...props} />
      <CopyrightEditSheet {...props} />
    </div>
  )
}