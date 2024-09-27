'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { DataProps } from '~/types'
import Link from 'next/link'
import { MessageSquareHeart, Star } from 'lucide-react'
import AnimatedBorderTrail from '~/components/animata/container/animated-border-trail'
import Counter from '~/components/animata/text/counter'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'

const invoices = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
  },
]

export default function CardList(props: Readonly<DataProps>) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="w-full grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <AnimatedBorderTrail trailSize="sm" className="h-full w-full">
          <Card className="h-full w-full border-0">
            <CardHeader>
              <CardTitle>照片数据</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col p2 space-y-4">
              <span className="font-light">照片数据</span>
              <span className="text-xl font-semibold"><Counter targetValue={props.data?.total || 0}/>张</span>
              <span className="font-light">显示照片</span>
              <span className="text-xl font-semibold"><Counter targetValue={props.data?.showTotal || 0}/>张</span>
              <Progress value={props.data?.showTotal / props.data?.total * 100 || 0} className="w-full h-2"/>
            </CardContent>
          </Card>
        </AnimatedBorderTrail>
        <AnimatedBorderTrail trailSize="sm" className="h-full w-full">
          <Card className="h-full w-full border-0">
            <CardHeader>
              <CardTitle>业务数据</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col p2 space-y-4">
              <span className="font-light">相册数据</span>
              <span className="text-xl font-semibold"><Counter targetValue={props.data?.tagsTotal || 0}/>个</span>
              <span className="font-light">版权数据</span>
              <span className="text-xl font-semibold"><Counter targetValue={props.data?.crTotal || 0}/>个</span>
            </CardContent>
          </Card>
        </AnimatedBorderTrail>
        <AnimatedBorderTrail trailSize="sm" className="h-full w-full">
          <Card className="h-full w-full border-0">
            <CardHeader>
              <CardTitle>感觉如何？</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
              <span className="flex items-center">
                <span className="pr-6">如果您觉得项目不错</span>
                <span className="h-px flex-1 bg-black"></span>
              </span>
              <Link href="https://github.com/besscroft/PicImpact" target="_blank">
                <Button>
                  <Star size={20} className="mr-1"/> Star
                </Button>
              </Link>
              <span className="flex items-center">
              <span className="pr-6">如果您有 Bug 反馈和建议</span>
              <span className="h-px flex-1 bg-black"></span>
              </span>
              <Link href="https://github.com/besscroft/PicImpact/issues/new" target="_blank">
                <Button>
                  <MessageSquareHeart size={20} className="mr-1"/> 反馈 | 建议
                </Button>
              </Link>
            </CardContent>
          </Card>
        </AnimatedBorderTrail>
      </div>
      <AnimatedBorderTrail trailSize="sm" className="h-full w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>相册</TableHead>
              <TableHead>数量/张</TableHead>
              <TableHead>显示/张</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.data?.result.map((item: any) => (
              <TableRow key={item.value}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{Number(item?.total)}</TableCell>
                <TableCell>{Number(item?.show_total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AnimatedBorderTrail>
    </div>
  )
}