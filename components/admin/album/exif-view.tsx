'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table.tsx'
import { Card } from '~/components/ui/card.tsx'
import type { ImageDataProps } from '~/types/props.ts'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

export default function ExifView(props: Readonly<ImageDataProps>) {
  return (
    <Card className="p-2">
      <Table aria-label="照片 Exif 信息">
        <TableHeader>
          <TableRow>
            <TableHead className="select-none">参数</TableHead>
            <TableHead className="select-none">值</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {
            props.data?.exif?.make &&
            <TableRow key="make">
              <TableCell className="font-medium">相机品牌</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.make}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.model &&
            <TableRow key="model">
              <TableCell className="font-medium">相机型号</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.model}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.bits &&
            <TableRow key="bits">
              <TableCell className="font-medium">bit 位数</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.bits}</TableCell>
            </TableRow>
          }
          {
            dayjs(props.data?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').isValid() &&
            <TableRow key="data_time">
              <TableCell className="font-medium">拍摄时间</TableCell>
              <TableCell className="truncate max-w-48">{dayjs(props.data?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.exposure_time &&
            <TableRow key="exposure_time">
              <TableCell className="font-medium">快门时间</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.exposure_time}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.f_number &&
            <TableRow key="f_number">
              <TableCell className="font-medium">光圈</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.f_number}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.exposure_program &&
            <TableRow key="exposure_program">
              <TableCell className="font-medium">曝光程序</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.exposure_program}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.iso_speed_rating &&
            <TableRow key="iso_speed_rating">
              <TableCell className="font-medium">ISO</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.iso_speed_rating}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.focal_length &&
            <TableRow key="focal_length">
              <TableCell className="font-medium">焦距</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.focal_length}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.lens_specification &&
            <TableRow key="lens_specification">
              <TableCell className="font-medium">镜头规格</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.lens_specification}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.lens_model &&
            <TableRow key="lens_model">
              <TableCell className="font-medium">镜头型号</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.lens_model}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.exposure_mode &&
            <TableRow key="exposure_mode">
              <TableCell className="font-medium">曝光模式</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.exposure_mode}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.cfa_pattern &&
            <TableRow key="cfa_pattern">
              <TableCell className="font-medium">CFA 模式</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.cfa_pattern}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.color_space &&
            <TableRow key="color_space">
              <TableCell className="font-medium">色彩空间</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.color_space}</TableCell>
            </TableRow>
          }
          {
            props.data?.exif?.white_balance &&
            <TableRow key="white_balance">
              <TableCell className="font-medium">白平衡</TableCell>
              <TableCell className="truncate max-w-48">{props.data?.exif?.white_balance}</TableCell>
            </TableRow>
          }
        </TableBody>
      </Table>
    </Card>
  )
}