'use client'

import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@nextui-org/react'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import { HandleProps } from '~/types'

export default function TagTable(props: Readonly<HandleProps>) {

  const { data } = useSWRHydrated(props)

  console.log(data)

  return (
    <>
      <Card isBlurred shadow="sm" className="h-48">
        <CardBody className="flex flex-col p2 space-y-4">
          <span className="font-light">照片数据</span>
          <span className="text-xl font-semibold">{data?.total || 0}张</span>
          <span className="font-light">显示照片</span>
          <span className="text-xl font-semibold">{data?.showTotal || 0}张</span>
        </CardBody>
      </Card>
      <Table aria-label="每个标签对应的数量">
        <TableHeader>
          <TableColumn>标签</TableColumn>
          <TableColumn>数量/张</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No rows to display."}>
          {data?.result && data?.result.map((item: any) => (
              <TableRow key={item?.tag_value}>
                <TableCell>{item?.name}</TableCell>
                <TableCell>{Number(item?.total)}</TableCell>
              </TableRow>
            ))
          }
        </TableBody>
      </Table>
    </>
  )
}