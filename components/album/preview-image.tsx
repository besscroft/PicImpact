'use client'

import type { HandleProps, ImageDataProps, PreviewImageHandleProps } from '~/types/props'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import LivePhoto from '~/components/album/live-photo'
import { toast } from 'sonner'
import { LinkIcon } from '~/components/icons/link'
import { DownloadIcon } from '~/components/icons/download'
import dayjs from 'dayjs'
import * as React from 'react'
import useSWR from 'swr'
import { useRouter } from 'next-nprogress-bar'
import { ClockIcon } from '~/components/icons/clock'
import { CameraIcon } from '~/components/icons/camera'
import { ApertureIcon } from '~/components/icons/aperture'
import { TimerIcon } from '~/components/icons/timer'
import { CrosshairIcon } from '~/components/icons/crosshair'
import { GaugeIcon } from '~/components/icons/gauge'
import 'react-lazy-load-image-component/src/effects/blur.css'
import { Badge } from '~/components/ui/badge'
import { LanguagesIcon } from '~/components/icons/languages'
import { CopyIcon } from '~/components/icons/copy'
import { RefreshCWIcon } from '~/components/icons/refresh-cw'
import { cn } from '~/lib/utils'
import PreviewImageExif from '~/components/album/preview-image-exif'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'

export default function PreviewImage(props: Readonly<PreviewImageHandleProps>) {
  const router = useRouter()
  const { data: download = false, mutate: setDownload } = useSWR(['masonry/download', props.data?.url ?? ''], null)

  const exifIconClass = 'dark:text-gray-50 text-gray-500'
  const exifTextClass = 'text-tiny text-sm select-none items-center dark:text-gray-50 text-gray-500'

  const exifProps: ImageDataProps = {
    data: props.data,
  }

  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps)

  async function downloadImg() {
    setDownload(true)
    try {
      let msg = '开始下载，原图较大，请耐心等待！'
      if (props.data.album_license != null) {
        msg += '图片版权归作者所有, 分享转载需遵循 ' + props.data.album_license + ' 许可协议！'
      }

      toast.warning(msg, { duration: 1500 })
      await fetch(`/api/open/get-image-blob?imageUrl=${props.data.url}`)
        .then((response) => response.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement("a");
          link.href = url;
          const parsedUrl = new URL(props.data.url);
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

  return (
    <div className="flex flex-col overflow-y-auto scrollbar-hide h-full !rounded-none max-w-none gap-0 p-2">
      <div className="h-full flex flex-col space-y-2 sm:grid sm:gap-2 sm:grid-cols-3 w-full">
        <div className="show-up-motion sm:col-span-2 sm:flex sm:justify-center sm:max-h-[90vh] select-none">
          {
            props.data.type === 1 ?
              <LazyLoadImage
                width={props.data.width}
                src={props.data.preview_url || props.data.url}
                alt={props.data.detail}
                className="object-contain md:max-h-[90vh]"
                effect="blur"
                wrapperProps={{
                  style: {transitionDelay: "0.5s"},
                }}
              />
              : <LivePhoto
                url={props.data.preview_url || props.data.url}
                videoUrl={props.data.video_url}
                className="md:h-[90vh] md:max-h-[90vh]"
              />
          }
        </div>
        <div className="flex w-full flex-col space-y-2">
          <div className="font-semibold">{props.data?.title}</div>
          {props.data?.exif?.make && props.data?.exif?.model &&
            <div className="flex items-center space-x-1">
              <CameraIcon className={exifIconClass} size={18} />
              <p className={exifTextClass}>
                {`${props.data?.exif?.make} ${props.data?.exif?.model}`}
              </p>
            </div>
          }
          <div className="flex flex-wrap space-x-2">
            {props.data?.exif?.f_number &&
              <div className="flex items-center space-x-1">
                <ApertureIcon className={exifIconClass} size={18} />
                <p className={exifTextClass}>
                  {props.data?.exif?.f_number}
                </p>
              </div>
            }
            {props.data?.exif?.exposure_time &&
              <div className="flex items-center space-x-1">
                <TimerIcon className={exifIconClass} size={18} />
                <p className={exifTextClass}>
                  {props.data?.exif?.exposure_time}
                </p>
              </div>
            }
            {props.data?.exif?.focal_length &&
              <div className="flex items-center space-x-1">
                <CrosshairIcon className={exifIconClass} size={18} />
                <p className={exifTextClass}>
                  {props.data?.exif?.focal_length}
                </p>
              </div>
            }
            {props.data?.exif?.iso_speed_rating &&
              <div className="flex items-center space-x-1">
                <GaugeIcon className={exifIconClass} size={18} />
                <p className={exifTextClass}>
                  {props.data?.exif?.iso_speed_rating}
                </p>
              </div>
            }
          </div>
          {props.data?.exif?.data_time &&
            <div className="flex items-center space-x-1">
              <ClockIcon className={exifIconClass} size={18} />
              <p className={exifTextClass}>
                {dayjs(props.data?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').isValid() ?
                  dayjs(props.data?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
                  : props.data?.exif.data_time
                }
              </p>
            </div>
          }
          <div className="flex flex-wrap space-x-1">
            <CopyIcon
              className={exifIconClass}
              size={20}
              onClick={async () => {
                try {
                  const url = props.data?.url
                  // @ts-ignore
                  await navigator.clipboard.writeText(url);
                  let msg = '复制图片链接成功！'
                  if (props.data?.album_license != null) {
                    msg = '图片版权归作者所有, 分享转载需遵循 ' + props.data?.album_license + ' 许可协议！'
                  }
                  toast.success(msg, {duration: 1500})
                } catch (error) {
                  toast.error('复制图片链接失败！', {duration: 500})
                }
              }}
            />
            <LinkIcon
              className={exifIconClass}
              size={20}
              onClick={async () => {
                try {
                  const url = window.location.origin + '/preview/' + props.id
                  // @ts-ignore
                  await navigator.clipboard.writeText(url);
                  toast.success('复制分享直链成功！', {duration: 500})
                } catch (error) {
                  toast.error('复制分享直链失败！', {duration: 500})
                }
              }}
            />
            {configData?.find((item: any) => item.config_key === 'custom_index_download_enable')?.config_value.toString() === 'true'
              && <>
                {download ?
                  <RefreshCWIcon
                    className={cn(exifIconClass, 'animate-spin cursor-not-allowed')}
                    size={20}
                  />:
                  <DownloadIcon
                    className={exifIconClass}
                    size={20}
                    onClick={() => downloadImg()}
                  />
                }
              </>
            }

            <PreviewImageExif {...exifProps} />
          </div>
          {props.data?.labels &&
            <div className="flex flex-wrap space-x-2">
              {props.data?.labels.map((tag: string) => (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  key={tag}
                  onClick={() => {
                    router.push(`/tag/${tag}`)
                  }}
                >{tag}</Badge>
              ))}
            </div>
          }
          {
            props.data?.detail &&
            <div className="flex items-center space-x-1">
              <LanguagesIcon className={exifIconClass} size={18} />
              <div className={cn(exifTextClass, 'text-wrap')}>
                {props.data?.detail}
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  )
}