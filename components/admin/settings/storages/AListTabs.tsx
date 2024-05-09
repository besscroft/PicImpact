'use client'

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, CardHeader, Button } from '@nextui-org/react'
import useSWR from 'swr'
import { fetcher } from '~/utils/fetcher'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function AListTabs() {
  const { data, error, isValidating, mutate } = useSWR('/api/v1/alist-info', fetcher
    , { revalidateOnFocus: false })
  const { setAListEdit, setAListEditData } = useButtonStore(
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
              <h4 className="text-small font-semibold leading-none text-default-600">AList 配置信息</h4>
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
              aria-label="刷新"
            >
              刷新
            </Button>
            <Button
              color="primary"
              variant="shadow"
              size="sm"
              radius="full"
              onClick={() => {
                setAListEdit(true)
                setAListEditData(JSON.parse(JSON.stringify(data)))
              }}
              aria-label="编辑"
            >
              编辑
            </Button>
          </div>
        </CardHeader>
      </ Card>
      {
        data &&
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
                    <TableCell className="truncate max-w-48">{item.config_value || 'N&A'}</TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
      }
    </div>
  )
}