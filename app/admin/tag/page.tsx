import { fetchTagsList } from '~/server/lib/query'
import TagList from '~/components/admin/tag/TagList'
import { Card, CardHeader } from '@nextui-org/react'
import RefreshButton from '~/components/RefreshButton'
import { HandleProps } from '~/types'
import React from 'react'
import TagAddSheet from '~/components/admin/tag/TagAddSheet'
import TagAddButton from '~/components/admin/tag/TagAddButton'
import TagEditSheet from '~/components/admin/tag/TagEditSheet'
import TagHelpSheet from '~/components/admin/tag/TagHelpSheet'
import TagHelp from '~/components/admin/tag/TagHelp'

export default async function List() {

  const getData = async () => {
    'use server'
    return await fetchTagsList()
  }

  const props: HandleProps = {
    handle: getData,
    args: 'getTags',
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
            <TagHelp />
            <TagAddButton />
            <RefreshButton {...props} />
          </div>
        </CardHeader>
      </Card>
      <TagList {...props} />
      <TagAddSheet {...props} />
      <TagEditSheet {...props} />
      <TagHelpSheet />
    </div>
  )
}