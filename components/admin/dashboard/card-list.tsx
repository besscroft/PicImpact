'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import type { AnalysisDataProps } from '~/types/props'
import Link from 'next/link'
import { MessageSquareHeart, Star, Send, ArrowUpDown } from 'lucide-react'
import TextCounter from '~/components/ui/origin/text-counter'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function CardList(props: Readonly<AnalysisDataProps>) {
  const t = useTranslations()
  const [sortConfig, setSortConfig] = useState<{
    key: 'camera' | 'lens' | 'count' | null;
    direction: 'ascending' | 'descending';
  }>({
    key: null,
    direction: 'ascending'
  })

  const sortedCameraStats = [...(props.data?.cameraStats || [])].sort((a, b) => {
    if (!sortConfig.key) return 0

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (sortConfig.key === 'count') {
      return sortConfig.direction === 'ascending' 
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue)
    }

    // For camera and lens, we know they are strings
    const aStr = String(aValue)
    const bStr = String(bValue)
    if (sortConfig.direction === 'ascending') {
      return aStr.localeCompare(bStr)
    }
    return bStr.localeCompare(aStr)
  })

  const requestSort = (key: 'camera' | 'lens' | 'count') => {
    let direction: 'ascending' | 'descending' = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: 'camera' | 'lens' | 'count') => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortConfig.direction === 'ascending' 
      ? <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" />
      : <ArrowUpDown className="ml-2 h-4 w-4" />
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="w-full grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="min-h-80 w-full border">
          <CardHeader>
            <CardTitle>{t('Dashboard.picData')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col p2 space-y-4">
            <div className="flex flex-col p2 space-y-4">
              <span className="font-light">{t('Dashboard.albumData')}</span>
              <span className="text-xl font-semibold">
                {props.data?.tagsTotal && props.data?.tagsTotal !== 0 ?
                  <TextCounter targetValue={props.data?.tagsTotal}/> : 0
                }
                {t('Dashboard.ge')}
              </span>
            </div>
            <div className="flex items-center justify-between p2 space-x-2">
              <div className="flex flex-col p2 space-y-2">
                <span className="font-light">{t('Dashboard.picData')}</span>
                <span className="text-xl font-semibold">
                  {props.data?.total && props.data?.total !== 0 ?
                    <TextCounter targetValue={props.data?.total}/> : 0
                  }
                  {t('Dashboard.zhang')}
                </span>
              </div>
              <div className="flex flex-col p2 space-y-2">
                <span className="font-light">{t('Dashboard.picShow')}</span>
                <span className="text-xl font-semibold">
                  {props.data?.showTotal && props.data?.showTotal !== 0 ?
                    <TextCounter targetValue={props.data?.showTotal}/> : 0
                  }
                  {t('Dashboard.zhang')}
                </span>
              </div>
            </div>
            <Progress value={(props.data?.showTotal ?? 0) / (props.data?.total ?? 1) * 100} className="w-full h-2"/>
          </CardContent>
        </Card>
        <Card className="h-80 w-full border">
          <CardHeader>
            <CardTitle>{t('Dashboard.albumData')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Words.album')}</TableHead>
                  <TableHead>{t('Dashboard.show')}</TableHead>
                  <TableHead>{t('Dashboard.count')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {props.data?.result?.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{Number(item?.total)}</TableCell>
                    <TableCell>{Number(item?.show_total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="h-80 w-full border">
          <CardHeader>
            <CardTitle>{t('Dashboard.how')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
              <span className="flex items-center">
                <span className="pr-6">{t('Dashboard.starTip')}</span>
                <span className="h-px flex-1 bg-black"></span>
              </span>
            <Link href="https://github.com/besscroft/PicImpact" target="_blank">
              <Button className="cursor-pointer" variant="outline">
                <Star size={20} className="mr-1"/> Star
              </Button>
            </Link>
            <span className="flex items-center">
              <span className="pr-6">{t('Dashboard.issueTip')}</span>
              <span className="h-px flex-1 bg-black"></span>
              </span>
            <Link href="https://github.com/besscroft/PicImpact/issues/new" target="_blank">
              <Button className="cursor-pointer" variant="outline">
                <MessageSquareHeart size={20} className="mr-1"/>{t('Button.issue')}
              </Button>
            </Link>
            <Link href="https://ziyume.com/docs/pic" target="_blank">
              <Button className="cursor-pointer" variant="link">
                <Send />
                文档
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer"
              onClick={() => requestSort('camera')}
            >
              <div className="flex items-center">
                {t('Dashboard.camera')}
                {getSortIcon('camera')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => requestSort('lens')}
            >
              <div className="flex items-center">
                {t('Dashboard.lens')}
                {getSortIcon('lens')}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer"
              onClick={() => requestSort('count')}
            >
              <div className="flex items-center justify-end">
                {t('Dashboard.count')}
                {getSortIcon('count')}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCameraStats.map((stat: any, index: number) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{stat.camera}</TableCell>
              <TableCell>{stat.lens}</TableCell>
              <TableCell className="text-right font-normal">
                <TextCounter
                  targetValue={Number(stat.count)}
                  fontStyle="text-sm font-normal text-foreground"
                  animated={false}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}