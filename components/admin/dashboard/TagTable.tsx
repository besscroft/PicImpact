'use client'

import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@nextui-org/react'
import { DataProps } from '~/types'

export default function TagTable(props: Readonly<DataProps>) {
  return (
    <>
      <Card isBlurred shadow="sm" className="h-48">
        <CardBody className="flex flex-col p2 space-y-4">
          <span className="font-light">照片数据</span>
          <span className="text-xl font-semibold">{props.data?.total || 0}张</span>
          <span className="font-light">显示照片</span>
          <span className="text-xl font-semibold">{props.data?.showTotal || 0}张</span>
        </CardBody>
      </Card>
      <Table aria-label="每个相册对应的数量">
        <TableHeader>
          <TableColumn>相册</TableColumn>
          <TableColumn>数量/张</TableColumn>
          <TableColumn>显示/张</TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No rows to display."}>
          {props.data?.result && props.data?.result.map((item: any) => (
              <TableRow key={item?.tag_value}>
                <TableCell>{item?.name}</TableCell>
                <TableCell>{Number(item?.total)}</TableCell>
                <TableCell>{Number(item?.show_total)}</TableCell>
              </TableRow>
            ))
          }
        </TableBody>
      </Table>
    </>
  )
}