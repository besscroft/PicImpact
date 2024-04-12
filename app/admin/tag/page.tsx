import { fetchTagsList } from '~/server/lib/query'
import TagList from '~/components/admin/tag/TagList'
import { Card, CardHeader } from '@nextui-org/card'
import RefreshButton from '~/components/RefreshButton'
import { HandleProps } from '~/types'
import {Button} from "@nextui-org/react";
import React from "react";

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
      <Card>
        <CardHeader className="justify-between">
          <div className="flex gap-5">
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-semibold leading-none text-default-600 select-none">标签管理</h4>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              color="primary"
              radius="full"
              size="sm"
              variant="shadow"
            >
              新增
            </Button>
            <RefreshButton {...props} />
          </div>
        </CardHeader>
      </Card>
      <TagList {...props} />
    </div>
  )
}