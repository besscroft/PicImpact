'use client'

import { useButtonStore } from '~/app/providers/button-store-Providers'
import { CopyrightType, DataProps, ImageType } from '~/types'
import {
  Aperture,
  Camera,
  Image as ImageIcon,
  Languages,
  CalendarDays,
  Copyright,
  Crosshair,
  Timer,
  CircleGauge,
  CircleAlert,
  ExternalLink
} from 'lucide-react'
import * as React from 'react'
import { useRouter } from 'next-nprogress-bar'
import ExifView from '~/components/album/ExifView'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '~/components/ui/tabs'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { CopyIcon } from '~/components/icons/copy'
import { DownloadIcon } from '~/components/icons/download'
import { LinkIcon } from '~/components/icons/link'
import { ArrowLeftIcon } from '~/components/icons/arrow-left'
import { ArrowRightIcon } from '~/components/icons/arrow-right'
import LivePhoto from '~/components/album/LivePhoto'

dayjs.extend(customParseFormat)

export default function MasonryItem() {
  const router = useRouter()
  const pathname = usePathname()
  const { MasonryView, MasonryViewData, MasonryViewDataList, setMasonryView, setMasonryViewData } = useButtonStore(
    (state) => state,
  )
  const {data: download = false, mutate: setDownload} = useSWR(['masonry/download', MasonryViewData.url], null)

  const props: DataProps = {
    data: MasonryViewData,
  }
  const tabsListRef = React.useRef<HTMLDivElement>(null);

  const loadingHandle = React.useCallback(async (handle: string) => {
    const idx = MasonryViewDataList.findIndex((item: ImageType) => MasonryViewData.id === item.id)
    if (handle === 'next' && idx === MasonryViewDataList.length - 1) {
      setMasonryViewData(MasonryViewDataList[0] || MasonryViewData)
    } else {
      const [prev, next] = [MasonryViewDataList.at(idx-1), MasonryViewDataList.at(idx+1)]
      if (handle === 'prev') {
        setMasonryViewData(prev || MasonryViewData)
      } else {
        setMasonryViewData(next || MasonryViewData)
      }
    }
  }, [MasonryViewData, MasonryViewDataList, setMasonryViewData]);
  

  async function downloadImg() {
    setDownload(true)
    try {
      let msg = '开始下载，原图较大，请耐心等待！'
      if (MasonryViewData.album_license != null) {
        msg += '图片版权归作者所有, 分享转载需遵循 ' + MasonryViewData.album_license + ' 许可协议！'
      }
      
      toast.warning(msg, { duration: 1500 })
      await fetch(`/api/open/get-image-blob?imageUrl=${MasonryViewData.url}`)
        .then((response) => response.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement("a");
          link.href = url;
          const parsedUrl = new URL(MasonryViewData.url);
          const filename = parsedUrl.pathname.split('/').pop();
          link.download = filename || "downloaded-file";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
    } catch (e) {
      toast.error('下载失败！', { duration: 500 })
    } finally {
      setDownload(false)
    }
  }

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (tabsListRef.current && tabsListRef.current.contains(e.target as Node)) {
        return;
      }

      if (MasonryView) {
        if (e.key === "ArrowLeft") {
          loadingHandle("prev");
        } else if (e.key === "ArrowRight") {
          loadingHandle("next");
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [MasonryView, loadingHandle]);

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
      <DialogHeader>
        <DialogTitle>{MasonryViewData.title}</DialogTitle>
      </DialogHeader>
      <DialogContent className="flex flex-col overflow-y-auto scrollbar-hide h-full !rounded-none">
        <div className="flex items-center">
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <p>{MasonryViewData.title}</p>
          </div>
        </div>
        <div className="h-full flex flex-col space-y-2 md:grid md:gap-2 md:grid-cols-3 xl:gap-4">
          <div className="md:col-span-2 md:flex md:justify-center md:max-h-[90vh]">
            {
              MasonryViewData.type === 1 ?
                <img
                  width={MasonryViewData.width}
                  loading="lazy"
                  src={MasonryViewData.preview_url || MasonryViewData.url}
                  alt={MasonryViewData.detail}
                  className="object-contain md:max-h-[90vh]"
                />
                : <LivePhoto
                  url={MasonryViewData.preview_url || MasonryViewData.url}
                  videoUrl={MasonryViewData.video_url}
                  className="md:h-[90vh] md:max-h-[90vh]"
                />
          }
          </div>
          <div className="flex w-full flex-col">
            {
              MasonryViewDataList.length > 0 &&
              <div className="flex w-full space-x-2 mb-2">
                <Button
                  className="w-full active:scale-95 duration-200 ease-in-out"
                  onClick={() => loadingHandle('prev')}
                  variant="outline"
                >
                  <ArrowLeftIcon />
                  上一张
                </Button>
                <Button
                  className="w-full active:scale-95 duration-200 ease-in-out"
                  onClick={() => loadingHandle('next')}
                  variant="outline"
                >
                  <ArrowRightIcon />
                  下一张
                </Button>
              </div>
            }
            <Tabs defaultValue="detail" className="w-full" ref={tabsListRef} aria-label="图片预览选择项">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="detail">
                  <div className="flex items-center space-x-2 select-none">
                    <ImageIcon size={20}/>
                    <span>详情</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="exif">
                  <div className="flex items-center space-x-2 select-none">
                    <Aperture size={20}/>
                    <span>Exif</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="copyright">
                  <div className="flex items-center space-x-2 select-none">
                    <Copyright size={20} />
                    <span>版权</span>
                  </div>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="detail">
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                  {
                    MasonryViewData.album_allow_download === 0 &&
                      <Button
                        onClick={async () => {
                          try {
                            const url = MasonryViewData.url
                            // @ts-ignore
                            await navigator.clipboard.writeText(url);
                            let msg = '复制图片链接成功！'
                            if (MasonryViewData.album_license != null) {
                              msg = '图片版权归作者所有, 分享转载需遵循 ' + MasonryViewData.album_license + ' 许可协议！'
                            }
                            toast.success(msg, {duration: 1500})
                          } catch (error) {
                            toast.error('复制图片链接失败！', {duration: 500})
                          }
                        }}
                        variant="outline"
                        className="active:scale-95 duration-200 ease-in-out"
                      >
                        <CopyIcon />
                        复制
                      </Button>
                  }
                    <Button
                      onClick={async () => {
                        try {
                          const url = window.location.origin + (pathname === '/' ? '/preview/' : pathname + '/preview/') + MasonryViewData.id
                          // @ts-ignore
                          await navigator.clipboard.writeText(url);
                          toast.success('复制分享直链成功！', {duration: 500})
                        } catch (error) {
                          toast.error('复制分享直链失败！', {duration: 500})
                        }
                      }}
                      variant="outline"
                      className="active:scale-95 duration-200 ease-in-out"
                    >
                      <LinkIcon />
                      分享
                    </Button>
                    {
                      MasonryViewData.album_allow_download === 0 &&
                        <Button
                          onClick={() => downloadImg()}
                          disabled={download}
                          variant="outline"
                          className="active:scale-95 duration-200 ease-in-out"
                        >
                          {download ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/> : <DownloadIcon />}
                          下载
                        </Button>
                    }
                  </div>
                  {
                    MasonryViewData.album_allow_download === 0 && (
                      <Card className="py-4 show-up-motion">
                      <div className="pb-0 pt-2 px-4 flex-col items-start">
                        <div className="flex items-center space-x-1">
                          <CircleAlert size={20}/>
                          <p className="text-tiny uppercase font-bold select-none">转载提示</p>
                        </div>
                        <h4 className="font-bold text-large">本作品由作者版权所有，未经授权禁止转载、下载及使用。</h4>
                      </div>
                    </Card>
                    )
                  }
                  {MasonryViewData?.exif?.model && MasonryViewData?.exif?.f_number
                    && MasonryViewData?.exif?.exposure_time && MasonryViewData?.exif?.focal_length
                    && MasonryViewData?.exif?.iso_speed_rating && MasonryViewData?.exif?.make &&
                    <Card className="py-2 show-up-motion">
                      <div className="pb-0 pt-2 px-2 flex-col items-start space-y-2">
                        <div className="flex items-center justify-center space-x-1 w-full">
                          <Camera size={20}/>
                          <p
                            className="text-tiny uppercase font-bold select-none items-center justify-center">{`${MasonryViewData?.exif?.make} ${MasonryViewData?.exif?.model}`}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-4 items-center justify-center w-full">
                          <div className="flex flex-col items-center justify-center w-full">
                            <Aperture size={20}/>
                            <p
                              className="text-tiny uppercase font-bold select-none">{MasonryViewData?.exif?.f_number}</p>
                          </div>
                          <div className="flex flex-col items-center justify-center w-full">
                            <Timer size={20}/>
                            <p
                              className="text-tiny uppercase font-bold select-none">{MasonryViewData?.exif?.exposure_time}</p>
                          </div>
                          <div className="flex flex-col items-center justify-center w-full">
                            <Crosshair size={20}/>
                            <p
                              className="text-tiny uppercase font-bold select-none">{MasonryViewData?.exif?.focal_length}</p>
                          </div>
                          <div className="flex flex-col items-center justify-center w-full">
                            <CircleGauge size={20}/>
                            <p
                              className="text-tiny uppercase font-bold select-none">ISO {MasonryViewData?.exif?.iso_speed_rating}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  }
                  <Card className="py-4 show-up-motion">
                    <div className="pb-0 pt-2 px-4 flex-col items-start">
                      <div className="flex items-center space-x-1">
                        <Languages size={20}/>
                        <p className="text-tiny uppercase font-bold select-none">相片描述</p>
                      </div>
                      <h4 className="font-bold text-large">{MasonryViewData.detail || 'N&A'}</h4>
                    </div>
                  </Card>
                  <Card className="py-4 show-up-motion">
                    <div className="pb-0 pt-2 px-4 flex-col items-start">
                      <div className="flex items-center space-x-1">
                        <CalendarDays size={20}/>
                        <p className="text-tiny uppercase font-bold select-none">拍摄时间</p>
                      </div>
                      {
                        dayjs(MasonryViewData?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').isValid()
                          ? <h4
                            className="font-bold text-large">{dayjs(MasonryViewData?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')}</h4>
                          : <h4 className="font-bold text-large">N&A</h4>
                      }
                    </div>
                  </Card>
                  {MasonryViewData?.labels &&
                    <div className="space-x-1">
                      {MasonryViewData?.labels.map((tag: string) => (
                        <span
                          key={tag}
                          onClick={() => {
                            setMasonryView(false)
                            router.push(`/label/${tag}`)
                          }}
                          className="cursor-pointer select-none inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700"
                        >
                          <p className="whitespace-nowrap text-sm">{tag}</p>
                        </span>
                      ))}
                    </div>
                  }
                </div>
              </TabsContent>
              <TabsContent value="exif">
                <ExifView {...props} />
              </TabsContent>
              <TabsContent value="copyright">
                <div className="flex flex-col space-y-2">
                  {Array.isArray(MasonryViewData.copyrights) && MasonryViewData.copyrights.length > 0 ?
                    <div className="flex flex-col space-y-2 mt-2 w-full">
                      {MasonryViewData.copyrights.map((copyright: CopyrightType) => {
                        if (copyright.type === 'social') {
                          return <Card key={copyright.id} className="flex h-32 flex-col show-up-motion justify-center">
                            <div className="flex justify-between w-full p-2 space-x-2">
                              <div className="flex justify-center items-center space-x-2">
                                <Avatar>
                                  <AvatarImage src={copyright.avatar_url} alt="avatar"/>
                                  <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col gap-1 items-start justify-center">
                                  <h4
                                    className="text-small font-semibold leading-none text-default-600">{copyright.name}</h4>
                                  <h5
                                    className="text-small tracking-tight text-default-400">{copyright.social_name}</h5>
                                </div>
                              </div>
                              <Link
                                href={copyright.url}
                                target="_blank"
                              >
                                <Button>
                                  Follow
                                </Button>
                              </Link>
                            </div>
                            <div
                              className="flex flex-1 px-3 py-0 text-small text-default-400 overflow-y-auto scrollbar-hide">
                              <p>
                                {copyright.detail}
                              </p>
                            </div>
                          </Card>
                        }
                      })}
                      {MasonryViewData.copyrights.map((copyright: CopyrightType) => {
                        if (copyright.type === 'target') {
                          return <Link
                            key={copyright.id}
                            className="flex items-center w-full p-2 hover:bg-slate-100 dark:hover:text-black"
                            href={copyright.url}
                            target="_blank"
                          >
                            <span className="flex-1 px-2">{copyright.name}</span>
                            <ExternalLink/>
                          </Link>
                        }
                      })}
                    </div>
                    : <p className="mt-2">暂无版权信息</p>}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}