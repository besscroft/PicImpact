'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { AnalysisDataProps } from '~/types'
import Link from 'next/link'
import { MessageSquareHeart, Star, Send } from 'lucide-react'
import Counter from '~/components/animata/text/counter'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { useTranslations } from 'next-intl'
import { ScrollArea } from "~/components/ui/scroll-area"

export default function CardList(props: Readonly<AnalysisDataProps>) {
  const t = useTranslations()

  return (
    <div className="flex flex-col space-y-2">
      <div className="w-full grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="h-full w-full border">
          <CardHeader>
            <CardTitle>{t('Dashboard.picData')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col p2 space-y-4">
            <span className="font-light">{t('Dashboard.picData')}</span>
            <span className="text-xl font-semibold">
                {props.data?.total && props.data?.total !== 0 ?
                  <Counter targetValue={props.data?.total}/> : 0
                }
              {t('Dashboard.zhang')}
              </span>
            <span className="font-light">{t('Dashboard.picShow')}</span>
            <span className="text-xl font-semibold">
                {props.data?.showTotal && props.data?.showTotal !== 0 ?
                  <Counter targetValue={props.data?.showTotal}/> : 0
                }
              {t('Dashboard.zhang')}
              </span>
            <Progress value={(props.data?.showTotal ?? 0) / (props.data?.total ?? 1) * 100} className="w-full h-2"/>
          </CardContent>
        </Card>
        <Card className="h-full w-full border">
          <CardHeader>
            <CardTitle>{t('Dashboard.bisData')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col p2 space-y-4">
            <span className="font-light">{t('Dashboard.albumData')}</span>
            <span className="text-xl font-semibold">
                {props.data?.tagsTotal && props.data?.tagsTotal !== 0 ?
                  <Counter targetValue={props.data?.tagsTotal}/> : 0
                }
              {t('Dashboard.ge')}
              </span>
            <span className="font-light">{t('Dashboard.copyrightData')}</span>
            <span className="text-xl font-semibold">
                {props.data?.crTotal && props.data?.crTotal !== 0 ?
                  <Counter targetValue={props.data?.crTotal}/> : 0
                }
              {t('Dashboard.ge')}
              </span>
          </CardContent>
        </Card>
        <Card className="h-full w-full border">
          <CardHeader>
            <CardTitle>{t('Dashboard.how')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
              <span className="flex items-center">
                <span className="pr-6">{t('Dashboard.starTip')}</span>
                <span className="h-px flex-1 bg-black"></span>
              </span>
            <Link href="https://github.com/besscroft/PicImpact" target="_blank">
              <Button variant="outline">
                <Star size={20} className="mr-1"/> Star
              </Button>
            </Link>
            <span className="flex items-center">
              <span className="pr-6">{t('Dashboard.issueTip')}</span>
              <span className="h-px flex-1 bg-black"></span>
              </span>
            <Link href="https://github.com/besscroft/PicImpact/issues/new" target="_blank">
              <Button variant="outline">
                <MessageSquareHeart size={20} className="mr-1"/>{t('Button.issue')}
              </Button>
            </Link>
            <Link href="https://ziyume.com/docs/pic" target="_blank">
              <Button variant="link">
                <Send />
                文档
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="h-full w-full border">
          <CardHeader>
            <CardTitle>{t('Dashboard.cameraStats')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Dashboard.camera')}</TableHead>
                    <TableHead>{t('Dashboard.lens')}</TableHead>
                    <TableHead className="text-right">{t('Dashboard.count')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {props.data?.cameraStats?.map((stat: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{stat.camera}</TableCell>
                      <TableCell>{stat.lens}</TableCell>
                      <TableCell className="text-right font-normal">
                        <Counter 
                          targetValue={Number(stat.count)}
                          fontStyle="text-sm font-normal text-foreground"
                          animated={false}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Words.album')}</TableHead>
            <TableHead>{t('Dashboard.count')}</TableHead>
            <TableHead>{t('Dashboard.show')}</TableHead>
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
    </div>
  )
}