'use client'

import {
  Dialog,
  DialogContent,
} from '~/components/ui/Dialog'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { ImageType } from '~/types'
import { Image, Tabs, Tab, Card, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Chip } from '@nextui-org/react'
import { Aperture, Camera, Image as ImageIcon, Languages, CalendarDays, X, SunMedium, MoonStar } from 'lucide-react'
import * as React from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next-nprogress-bar'

export default function MasonryItem() {
  const router = useRouter()
  const { MasonryView, MasonryViewData, setMasonryView, setMasonryViewData } = useButtonStore(
    (state) => state,
  )
  const { theme, setTheme } = useTheme()

  return (
    <Dialog
      defaultOpen={false}
      open={MasonryView}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setMasonryView(false)
          setMasonryViewData({} as ImageType)
        }
      }}
    >
      <DialogContent className="flex flex-col">
        <div className="flex items-center">
          <div className="flex-1">
            <p>{MasonryViewData.detail}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              isIconOnly
              variant="shadow"
              size="sm"
              aria-label="切换主题"
              className="bg-white dark:bg-gray-800"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <SunMedium size={20} /> : <MoonStar size={20} />}
            </Button>
            <Button
              isIconOnly
              variant="shadow"
              size="sm"
              aria-label="关闭"
              className="bg-white dark:bg-gray-800"
              onClick={() => {
                setMasonryView(false)
                setMasonryViewData({} as ImageType)
              }}
            >
              <X size={20}/>
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>
        <div className="h-full flex flex-col space-y-2 md:grid md:gap-2 md:grid-cols-3 xl:gap-4">
          <div className="md:col-span-2 md:flex md:justify-center md:max-h-[90vh]">
            <Image
              className="object-contain md:max-h-[90vh]"
              alt={MasonryViewData.detail}
              src={MasonryViewData.url}
              radius="none"
              loading="lazy"
            />
          </div>
          <div className="flex w-full flex-col">
            <Tabs aria-label="图片预览选择项" color="primary" variant="bordered">
              <Tab
                key="detail"
                title={
                  <div className="flex items-center space-x-2 select-none">
                    <ImageIcon />
                    <span>详情</span>
                  </div>
                }
              >
                <div className="flex flex-col space-y-2">
                  <Card className="py-4" shadow="sm">
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                      <div className="flex items-center space-x-1">
                        <Camera size={20}/>
                        <p className="text-tiny uppercase font-bold select-none">相机</p>
                      </div>
                      <h4 className="font-bold text-large">{MasonryViewData?.exif?.model || 'N&A'}</h4>
                    </CardHeader>
                  </Card>
                  <Card className="py-4" shadow="sm">
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                      <div className="flex items-center space-x-1">
                        <Languages size={20}/>
                        <p className="text-tiny uppercase font-bold select-none">相片描述</p>
                      </div>
                      <h4 className="font-bold text-large">{MasonryViewData.detail || 'N&A'}</h4>
                    </CardHeader>
                  </Card>
                  <Card className="py-4" shadow="sm">
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                      <div className="flex items-center space-x-1">
                        <CalendarDays size={20}/>
                        <p className="text-tiny uppercase font-bold select-none">拍摄时间</p>
                      </div>
                      <h4 className="font-bold text-large">{MasonryViewData?.exif?.data_time || 'N&A'}</h4>
                    </CardHeader>
                  </Card>
                  {MasonryViewData?.labels &&
                    <div className="space-x-1">
                      {MasonryViewData?.labels.map((tag: string) => (
                        <Chip
                          key={tag}
                          variant="bordered"
                          className="cursor-pointer select-none"
                          onClick={() => {
                            setMasonryView(false)
                            router.push(`/label/${tag}`)
                          }}
                        >{tag}</Chip>
                      ))}
                    </div>
                  }
                </div>
              </Tab>
              <Tab
                key="exif"
                title={
                  <div className="flex items-center space-x-2 select-none">
                    <Aperture />
                    <span>Exif</span>
                  </div>
                }
              >
                <Table aria-label="照片 Exif 信息">
                  <TableHeader>
                    <TableColumn>参数</TableColumn>
                    <TableColumn>值</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent={"No rows to display."}>
                    {
                      MasonryViewData?.exif?.make &&
                      <TableRow key="make">
                        <TableCell>相机品牌</TableCell>
                        <TableCell>{MasonryViewData?.exif?.make}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.model &&
                      <TableRow key="model">
                        <TableCell>相机型号</TableCell>
                        <TableCell>{MasonryViewData?.exif?.model}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.bits &&
                      <TableRow key="bits">
                        <TableCell>bit 位数</TableCell>
                        <TableCell>{MasonryViewData?.exif?.bits}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.data_time &&
                      <TableRow key="data_time">
                        <TableCell>拍摄时间</TableCell>
                        <TableCell>{MasonryViewData?.exif?.data_time}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.exposure_time &&
                      <TableRow key="exposure_time">
                        <TableCell>快门时间</TableCell>
                        <TableCell>{MasonryViewData?.exif?.exposure_time}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.f_number &&
                      <TableRow key="f_number">
                        <TableCell>光圈</TableCell>
                        <TableCell>{MasonryViewData?.exif?.f_number}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.exposure_program &&
                      <TableRow key="exposure_program">
                        <TableCell>曝光程序</TableCell>
                        <TableCell>{MasonryViewData?.exif?.exposure_program}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.iso_speed_rating &&
                      <TableRow key="iso_speed_rating">
                        <TableCell>ISO</TableCell>
                        <TableCell>{MasonryViewData?.exif?.iso_speed_rating}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.focal_length &&
                      <TableRow key="focal_length">
                        <TableCell>焦距</TableCell>
                        <TableCell>{MasonryViewData?.exif?.focal_length}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.lens_specification &&
                      <TableRow key="lens_specification">
                        <TableCell>镜头规格</TableCell>
                        <TableCell>{MasonryViewData?.exif?.lens_specification}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.lens_model &&
                      <TableRow key="lens_model">
                        <TableCell>镜头型号</TableCell>
                        <TableCell>{MasonryViewData?.exif?.lens_model}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.exposure_mode &&
                      <TableRow key="exposure_mode">
                        <TableCell>曝光模式</TableCell>
                        <TableCell>{MasonryViewData?.exif?.exposure_mode}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.cfa_pattern &&
                      <TableRow key="cfa_pattern">
                        <TableCell>CFA 模式</TableCell>
                        <TableCell>{MasonryViewData?.exif?.cfa_pattern}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.color_space &&
                      <TableRow key="color_space">
                        <TableCell>色彩空间</TableCell>
                        <TableCell>{MasonryViewData?.exif?.color_space}</TableCell>
                      </TableRow>
                    }
                    {
                      MasonryViewData?.exif?.white_balance &&
                      <TableRow key="white_balance">
                        <TableCell>白平衡</TableCell>
                        <TableCell>{MasonryViewData?.exif?.white_balance}</TableCell>
                      </TableRow>
                    }
                  </TableBody>
                </Table>
              </Tab>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}