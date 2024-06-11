'use client'

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@nextui-org/react'
import React from 'react'
import { DataProps } from '~/types'

export default function ExifView(props: Readonly<DataProps>) {
  return (
    <Table aria-label="照片 Exif 信息">
      <TableHeader>
        <TableColumn>参数</TableColumn>
        <TableColumn>值</TableColumn>
      </TableHeader>
      <TableBody emptyContent={"No rows to display."}>
        {
          props.data?.exif?.make &&
          <TableRow key="make">
            <TableCell>相机品牌</TableCell>
            <TableCell>{props.data?.exif?.make}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.model &&
          <TableRow key="model">
            <TableCell>相机型号</TableCell>
            <TableCell>{props.data?.exif?.model}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.bits &&
          <TableRow key="bits">
            <TableCell>bit 位数</TableCell>
            <TableCell>{props.data?.exif?.bits}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.data_time &&
          <TableRow key="data_time">
            <TableCell>拍摄时间</TableCell>
            <TableCell>{props.data?.exif?.data_time}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.exposure_time &&
          <TableRow key="exposure_time">
            <TableCell>快门时间</TableCell>
            <TableCell>{props.data?.exif?.exposure_time}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.f_number &&
          <TableRow key="f_number">
            <TableCell>光圈</TableCell>
            <TableCell>{props.data?.exif?.f_number}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.exposure_program &&
          <TableRow key="exposure_program">
            <TableCell>曝光程序</TableCell>
            <TableCell>{props.data?.exif?.exposure_program}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.iso_speed_rating &&
          <TableRow key="iso_speed_rating">
            <TableCell>ISO</TableCell>
            <TableCell>{props.data?.exif?.iso_speed_rating}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.focal_length &&
          <TableRow key="focal_length">
            <TableCell>焦距</TableCell>
            <TableCell>{props.data?.exif?.focal_length}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.lens_specification &&
          <TableRow key="lens_specification">
            <TableCell>镜头规格</TableCell>
            <TableCell>{props.data?.exif?.lens_specification}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.lens_model &&
          <TableRow key="lens_model">
            <TableCell>镜头型号</TableCell>
            <TableCell>{props.data?.exif?.lens_model}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.exposure_mode &&
          <TableRow key="exposure_mode">
            <TableCell>曝光模式</TableCell>
            <TableCell>{props.data?.exif?.exposure_mode}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.cfa_pattern &&
          <TableRow key="cfa_pattern">
            <TableCell>CFA 模式</TableCell>
            <TableCell>{props.data?.exif?.cfa_pattern}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.color_space &&
          <TableRow key="color_space">
            <TableCell>色彩空间</TableCell>
            <TableCell>{props.data?.exif?.color_space}</TableCell>
          </TableRow>
        }
        {
          props.data?.exif?.white_balance &&
          <TableRow key="white_balance">
            <TableCell>白平衡</TableCell>
            <TableCell>{props.data?.exif?.white_balance}</TableCell>
          </TableRow>
        }
      </TableBody>
    </Table>
  )
}