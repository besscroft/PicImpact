import { fetchCopyrightList } from '~/server/db/query/copyrights'
import type { HandleProps } from '~/types/props'
import React from 'react'
import CopyrightList from '~/components/admin/copyright/copyright-list'
import CopyrightAddButton from '~/components/admin/copyright/copyright-add-button'
import RefreshButton from '~/components/album/refresh-button'
import CopyrightAddSheet from '~/components/admin/copyright/copyright-add-sheet'
import CopyrightEditSheet from '~/components/admin/copyright/copyright-edit-sheet'

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
      <div className="flex justify-between">
        <div className="flex gap-5">
          <div className="flex flex-col gap-1 items-start justify-center">
            <h4 className="text-small font-semibold leading-none text-default-600 select-none">版权管理</h4>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <CopyrightAddButton />
          <RefreshButton {...props} />
        </div>
      </div>
      <CopyrightList {...props} />
      <CopyrightAddSheet {...props} />
      <CopyrightEditSheet {...props} />
    </div>
  )
}