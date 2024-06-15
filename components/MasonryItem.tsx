'use client'

import {
  Dialog,
  DialogContent,
} from '~/components/ui/Dialog'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { CopyrightType, DataProps, ImageType } from '~/types'
import { Image, Tabs, Tab, Card, CardHeader, CardBody, CardFooter, Button, Chip, Link, Avatar } from '@nextui-org/react'
import { Aperture, Camera, Image as ImageIcon, Languages, CalendarDays, X, SunMedium, MoonStar, Copyright, Crosshair, Timer, CircleGauge } from 'lucide-react'
import * as React from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next-nprogress-bar'
import ExifView from '~/components/ExifView'

export default function MasonryItem() {
  const router = useRouter()
  const { MasonryView, MasonryViewData, setMasonryView, setMasonryViewData } = useButtonStore(
    (state) => state,
  )
  const { theme, setTheme } = useTheme()

  const props: DataProps = {
    data: MasonryViewData,
  }

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
            <p>{MasonryViewData.title}</p>
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
                  {MasonryViewData?.exif?.model && MasonryViewData?.exif?.f_number
                    && MasonryViewData?.exif?.exposure_time && MasonryViewData?.exif?.focal_length
                    && MasonryViewData?.exif?.iso_speed_rating &&
                    <Card className="py-2" shadow="sm">
                      <CardHeader className="pb-0 pt-2 px-2 flex-col items-start space-y-2">
                        <div className="flex items-center justify-center space-x-1 w-full">
                          <Camera size={20}/>
                          <p className="text-tiny uppercase font-bold select-none items-center justify-center">{MasonryViewData?.exif?.model}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-4 items-center justify-center w-full">
                          <div className="flex flex-col items-center justify-center w-full">
                            <Aperture size={20}/>
                            <p className="text-tiny uppercase font-bold select-none">{MasonryViewData?.exif?.f_number}</p>
                          </div>
                          <div className="flex flex-col items-center justify-center w-full">
                            <Timer size={20}/>
                            <p className="text-tiny uppercase font-bold select-none">{MasonryViewData?.exif?.exposure_time}</p>
                          </div>
                          <div className="flex flex-col items-center justify-center w-full">
                            <Crosshair size={20}/>
                            <p className="text-tiny uppercase font-bold select-none">{MasonryViewData?.exif?.focal_length}</p>
                          </div>
                          <div className="flex flex-col items-center justify-center w-full">
                            <CircleGauge size={20}/>
                            <p className="text-tiny uppercase font-bold select-none">ISO {MasonryViewData?.exif?.iso_speed_rating}</p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  }
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
                <ExifView {...props} />
              </Tab>
              <Tab
                key="copyright"
                title={
                  <div className="flex items-center space-x-2 select-none">
                    <Copyright/>
                    <span>版权</span>
                  </div>
                }
              >
                <div className="flex flex-col space-y-2">
                  {Array.isArray(MasonryViewData.copyrights) && MasonryViewData.copyrights.length > 0 ?
                    <div className="flex flex-col space-y-2 mt-2">
                      {MasonryViewData.copyrights.map((copyright: CopyrightType) => {
                        if (copyright.type === 'social') {
                          return <Card key={copyright.id} shadow="sm">
                            <CardHeader className="justify-between">
                              <div className="flex gap-5">
                                <Avatar isBordered radius="full" size="md" src={copyright.avatar_url} />
                                <div className="flex flex-col gap-1 items-start justify-center">
                                  <h4 className="text-small font-semibold leading-none text-default-600">{copyright.name}</h4>
                                  <h5 className="text-small tracking-tight text-default-400">{copyright.social_name}</h5>
                                </div>
                              </div>
                              <Button
                                href={copyright.url}
                                color="primary"
                                as={Link}
                                radius="full"
                                size="sm"
                                isExternal
                              >
                                Follow
                              </Button>
                            </CardHeader>
                            <CardBody className="px-3 py-0 text-small text-default-400 overflow-y-auto scrollbar-hide max-h-32">
                              <p>
                                {copyright.detail}
                              </p>
                            </CardBody>
                            <CardFooter className="gap-3">
                              <span className="pt-2">
                                #社交媒体
                                <span className="py-2" aria-label="computer" role="img">
                                  💻
                                </span>
                              </span>
                            </CardFooter>
                          </Card>
                        }
                      })}
                      {MasonryViewData.copyrights.map((copyright: CopyrightType) => {
                        if (copyright.type === 'target') {
                          return <Link
                            key={copyright.id}
                            isBlock
                            showAnchorIcon
                            href={copyright.url}
                            color="primary"
                            underline="always"
                            isExternal
                          >
                            {copyright.name}
                          </Link>
                        }
                      })}
                    </div>
                    : <p className="mt-2">暂无版权信息</p>}
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}