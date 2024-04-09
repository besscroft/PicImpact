'use client'

import React from 'react'
import { Card, CardHeader } from '@nextui-org/card'
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react'
import { Table } from 'antd'
import type { TableProps } from 'antd'
import useSWR from 'swr'
import { fetcher } from '~/utils/fetcher'
import { toast } from 'sonner'
import { DeleteDocumentBulkIcon, EditDocumentBulkIcon, SendFilledIcon, LinkIcon } from '@nextui-org/shared-icons'

interface DataType {
  id: number;
  tag: string;
  url: string;
  exif: any;
  rating: number;
  detail: string;
  show: number;
  sort: number;
}

const iconClasses = 'text-xl text-default-500 pointer-events-none flex-shrink-0'

const columns: TableProps<DataType>['columns'] = [
  {
    title: '标签',
    dataIndex: 'tag',
  },
  {
    title: '评分',
    dataIndex: 'rating',
  },
  {
    title: '说明',
    dataIndex: 'detail',
  },
  {
    title: '显示',
    dataIndex: 'show',
  },
  {
    title: '排序',
    dataIndex: 'sort',
  },
  {
    title: '操作',
    key: 'action',
    render: (_, record) => (
      <Dropdown>
        <DropdownTrigger>
          <Button
            isIconOnly
            variant="bordered"
          >
            <SendFilledIcon />
          </Button>
        </DropdownTrigger>
        <DropdownMenu variant="faded" aria-label="图片操作选项卡">
          <DropdownItem
            key="edit"
            description="编辑图片信息"
            startContent={<EditDocumentBulkIcon className={iconClasses} />}
            onClick={() => toast.warning('还没写！')}
          >
            编辑
          </DropdownItem>
          <DropdownItem
            key="edit"
            description="同步图片地址"
            startContent={<LinkIcon className={iconClasses} />}
            onClick={() => toast.warning('还没写！')}
          >
            同步
          </DropdownItem>
          <DropdownItem
            key="delete"
            description="删除图片"
            startContent={<DeleteDocumentBulkIcon className={iconClasses + ' text-red-500'} />}
            onClick={() => toast.warning('还没写！')}
          >
            删除
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    ),
  },
];

export default async function List() {
  const { data, error, isLoading, isValidating, mutate  } = useSWR('/api/get-images', fetcher)

  if (error) {
    toast.error('数据获取失败！')
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
          <Button
            color="primary"
            radius="full"
            size="sm"
            isLoading={isValidating}
            onClick={() => mutate()}
          >
            刷新
          </Button>
        </CardHeader>
      </Card>
      <Table
        bordered
        columns={columns}
        dataSource={data}
        loading={isValidating}
      />
    </div>
  )
}