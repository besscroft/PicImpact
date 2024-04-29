'use client'

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Skeleton, Card, CardHeader, Button } from '@nextui-org/react'
import useSWR from 'swr'
import { fetcher } from '~/utils/fetcher'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function S3Tabs() {
  const { data, error, isLoading, isValidating, mutate } = useSWR('/api/v1/s3-info', fetcher
    , { revalidateOnFocus: false })
  const { setS3Edit, setS3EditData } = useButtonStore(
    (state) => state,
  )

  if (error) {
    toast.error('请求失败！')
  }

  return (
    <div className="space-y-2">
      <Card shadow="sm">
        <CardHeader className="justify-between">
          <div className="flex gap-5">
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-semibold leading-none text-default-600">S3 配置信息</h4>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              color="primary"
              variant="shadow"
              size="sm"
              radius="full"
              isLoading={isValidating}
              onClick={() => mutate()}
            >
              刷新
            </Button>
            <Button
              color="primary"
              variant="shadow"
              size="sm"
              radius="full"
              onClick={() => {
                setS3Edit(true)
                setS3EditData(JSON.parse(JSON.stringify(data)))
              }}
            >
              编辑
            </Button>
          </div>
        </CardHeader>
      </ Card>
      {
        !isValidating && data ?
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
                    <TableCell>{item.config_value || 'N&A'}</TableCell>
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