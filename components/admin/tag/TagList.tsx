'use client'

import React from 'react'
import { HandleProps } from '~/types'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import { Card, CardBody, CardHeader, CardFooter, Chip, Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react'
import { CaretSortIcon } from '@radix-ui/react-icons'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '~/components/ui/ContextMenu'
import { toast } from 'sonner'
import DefaultTag from '~/components/admin/tag/DefaultTag'

interface DataType {
  id: number;
  name: string;
  tag_value: string;
  detail: string;
  show: number;
  sort: number;
}

export default function TagList(props : Readonly<HandleProps>) {
  const { data, isLoading, error } = useSWRHydrated(props)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {
        !isLoading && !error && data ?
          <>
            <DefaultTag />
            {data.map((tag: DataType) => (
            <ContextMenu key={tag.id}>
              <ContextMenuTrigger>
                <Card>
                  <CardHeader className="flex gap-3">
                    <p>{tag.name}</p>
                    <Popover placement="top">
                      <PopoverTrigger className="cursor-pointer">
                        <Chip className="select-none" color="success" variant="shadow">{tag.tag_value}</Chip>
                      </PopoverTrigger>
                      <PopoverContent>
                        <div className="px-1 py-2 select-none">
                          <div className="text-small font-bold">路由</div>
                          <div className="text-tiny">可以访问的一级路径</div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </CardHeader>
                  <CardBody>
                    <p>{tag.detail || '没有介绍'}</p>
                  </CardBody>
                  <CardFooter className="flex space-x-1 select-none">
                    {
                      tag.show === 0 ?
                        <Chip color="success" variant="shadow">显示</Chip>
                        :
                        <Chip color="danger" variant="shadow">不显示</Chip>
                    }
                    <Popover placement="top">
                      <PopoverTrigger className="cursor-pointer">
                        <Chip
                          color="primary"
                          variant="shadow"
                          startContent={<CaretSortIcon />}
                        >{tag.sort}</Chip>
                      </PopoverTrigger>
                      <PopoverContent>
                        <div className="px-1 py-2 select-none">
                          <div className="text-small font-bold">排序</div>
                          <div className="text-tiny">规则为从高到低</div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </CardFooter>
                </Card>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem className="cursor-pointer" onClick={() => toast.warning('还没写！')}>编辑</ContextMenuItem>
                <ContextMenuItem className="cursor-pointer" onClick={() => toast.warning('还没写！')}>删除</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
            ))}
          </>
          : error ?
            <DefaultTag />
            : <p>加载中...</p>
      }
    </div>
  )
}