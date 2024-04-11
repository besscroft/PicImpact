'use client'

import React from 'react'
import { Table, type TableProps } from 'antd'
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react'
import { DeleteDocumentBulkIcon, EditDocumentBulkIcon, SendFilledIcon } from '@nextui-org/shared-icons'
import { toast } from 'sonner'
import useSWR from 'swr'

interface DataType {
  id: number;
  name: string;
  tag_value: string;
  detail: string;
  show: number;
}

const iconClasses = 'text-xl text-default-500 pointer-events-none flex-shrink-0'

export default function TagList({handleClick: onClick}: any) {
  const { data, error, isLoading, isValidating } = useSWR('getTags',
    () => {
    return onClick()
  })

  console.log(data)

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '标签名称',
      dataIndex: 'name',
    },
    {
      title: '标签值',
      dataIndex: 'tag_value',
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
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Dropdown>
          <DropdownTrigger>
            <Button
              isIconOnly
              variant="bordered"
            >
              <SendFilledIcon/>
            </Button>
          </DropdownTrigger>
          <DropdownMenu variant="faded" aria-label="标签操作选项卡">
            <DropdownItem
              key="edit"
              description="编辑标签信息"
              startContent={<EditDocumentBulkIcon className={iconClasses}/>}
              onClick={() => toast.warning('还没写！')}
            >
              编辑
            </DropdownItem>
            <DropdownItem
              key="delete"
              description="删除标签"
              startContent={<DeleteDocumentBulkIcon className={iconClasses + ' text-red-500'}/>}
              onClick={() => toast.warning('还没写！')}
            >
              删除
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      ),
    },
  ];

  return (
    <Table
      bordered
      columns={columns}
      loading={isValidating}
      dataSource={data}
    />
  )
}