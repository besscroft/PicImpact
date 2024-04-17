'use client'

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Skeleton, Card, CardHeader, Button } from '@nextui-org/react'
import useSWR from 'swr'
import { fetcher } from '~/utils/fetcher'
import { toast } from 'sonner'

export default function AListTabs() {
  const { data, error, isLoading } = useSWR('/api/v1/alist-info', fetcher)

  if (error) {
    toast.error('请求失败！')
  }

  return (
    <div className="space-y-2">
      <Card shadow="sm">
        <CardHeader className="justify-between">
          <div className="flex gap-5">
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-semibold leading-none text-default-600">AList 配置信息</h4>
            </div>
          </div>
          <Button
            color="primary"
            variant="light"
            radius="full"
            onClick={() => toast.info('还没写')}
          >
            编辑
          </Button>
        </CardHeader>
      </ Card>
      {
        !isLoading && data ?
          <Table aria-label="S3 设置">
            <TableHeader>
              <TableColumn>Key</TableColumn>
              <TableColumn>Value</TableColumn>
            </TableHeader>
            <TableBody emptyContent={"No rows to display."}>
              {
                data.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.config_key}</TableCell>
                    <TableCell className="truncate max-w-60">{item.config_value || 'N&A'}</TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
          :
          <div className="w-full p-2 space-y-4">
            <Skeleton className="w-full rounded-md">
              <div className="h-4 w-full rounded-md bg-white"></div>
            </Skeleton>
            <Skeleton className="w-full rounded-md">
              <div className="h-4 w-full rounded-md bg-white"></div>
            </Skeleton>
            <Skeleton className="w-full rounded-md">
              <div className="h-4 w-full rounded-md bg-white"></div>
            </Skeleton>
          </div>
      }
    </div>
  )
}