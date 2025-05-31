'use client'

import type { HandleProps, ImageDataProps, PreviewImageHandleProps } from '~/types/props'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import LivePhoto from '~/components/album/live-photo'
import { toast } from 'sonner'
import { LinkIcon } from '~/components/icons/link'
import { DownloadIcon } from '~/components/icons/download'
import dayjs from 'dayjs'
import useSWR from 'swr'
import { useRouter } from 'next-nprogress-bar'
import { ClockIcon } from '~/components/icons/clock'
import { CameraIcon } from '~/components/icons/camera'
import { ApertureIcon } from '~/components/icons/aperture'
import { TimerIcon } from '~/components/icons/timer'
import { CrosshairIcon } from '~/components/icons/crosshair'
import { GaugeIcon } from '~/components/icons/gauge'
import { XIcon } from '~/components/icons/x'
import 'react-lazy-load-image-component/src/effects/blur.css'
import { Badge } from '~/components/ui/badge'
import { LanguagesIcon } from '~/components/icons/languages'
import { CopyIcon } from '~/components/icons/copy'
import { RefreshCWIcon } from '~/components/icons/refresh-cw'
import { cn } from '~/lib/utils'
import PreviewImageExif from '~/components/album/preview-image-exif'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { useRef, useState } from 'react'
import { Zoom } from 'yet-another-react-lightbox/plugins'
import { ExpandIcon } from '~/components/icons/expand'
import { useTranslations } from 'next-intl'

export default function PreviewImage(props: Readonly<PreviewImageHandleProps>) {
  const router = useRouter()
  const t = useTranslations()
  const { data: download = false, mutate: setDownload } = useSWR(['masonry/download', props.data?.url ?? ''], null)
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(undefined)
  const zoomRef = useRef(null)

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

  const handleClose = () => {
    if (window != undefined) {
      if (window.history.length > 1) {
        router.back()
        return
      }
    }
    if (props.data?.album_value) {
      router.push(`${props.data.album_value}`)
    } else {
      router.push('/')
    }
  }

  const handleDownload = async () => {
    setDownload(true)
    try {
      let msg = t('Tips.downloadStart')
      if (props.data?.album_license != null) {
        msg += t('Tips.downloadLicense', { license: props.data.album_license })
      }

      toast.warning(msg, { duration: 1500 })

      // 获取存储类型
      const storageType = props.data?.url?.includes('s3') ? 's3' : 'r2'

      // 使用新的下载 API
      let response = await fetch(`/api/v1/download/${props.id}?storage=${storageType}`)
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        // 如果是 JSON 响应，说明是直接下载模式
        const data = await response.json()
        // 直接使用 window.location.href 触发下载
        response = await fetch(data.url)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      const parsedUrl = new URL(props.data?.url ?? '')
      const filename = parsedUrl.pathname.split('/').pop()
      link.download = filename || 'downloaded-file'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      toast.error(t('Tips.downloadFailed'), { duration: 500 })
    } finally {
      setDownload(false)
    }
  }

  if (!props.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t('Tips.loading')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-y-auto scrollbar-hide h-full !rounded-none max-w-none gap-0 p-2">
      <div className="relative h-full flex flex-col space-y-2 sm:grid sm:gap-2 sm:grid-cols-3 w-full">
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
                  style: { transitionDelay: '0.5s' },
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
          <div className="flex items-center justify-between">
            <div className="flex-1 font-semibold">{props.data?.title}</div>
            <button
              onClick={handleClose}
              className="z-50"
              aria-label={t('Button.goBack')}
            >
              <XIcon className={exifIconClass} size={18} />
            </button>
          </div>
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
                  await navigator.clipboard.writeText(url)
                  let msg = t('Tips.copyImageSuccess')
                  if (props.data?.album_license != null) {
                    msg = t('Tips.downloadLicense', { license: props.data?.album_license })
                  }
                  toast.success(msg, { duration: 1500 })
                } catch {
                  toast.error(t('Tips.copyImageFailed'), { duration: 500 })
                }
              }}
            />
            <LinkIcon
              className={exifIconClass}
              size={20}
              onClick={async () => {
                try {
                  const url = window.location.origin + '/preview/' + props.id
                  await navigator.clipboard.writeText(url)
                  toast.success(t('Tips.copyShareSuccess'), { duration: 500 })
                } catch {
                  toast.error(t('Tips.copyShareFailed'), { duration: 500 })
                }
              }}
            />
            {configData?.find((item: any) => item.config_key === 'custom_index_download_enable')?.config_value.toString() === 'true'
              && <>
                {download ?
                  <RefreshCWIcon
                    className={cn(exifIconClass, 'animate-spin cursor-not-allowed')}
                    size={20}
                  /> :
                  <DownloadIcon
                    className={exifIconClass}
                    size={20}
                    onClick={() => handleDownload()}
                  />
                }
              </>
            }
            <PreviewImageExif {...exifProps} />
            <ExpandIcon
              className={exifIconClass}
              size={20}
              onClick={() => {
                setLightboxPhoto({
                  src: props.data.preview_url || props.data.url,
                  alt: props.data.detail,
                })
              }}
            />
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
      <Lightbox
        open={Boolean(lightboxPhoto)}
        close={() => setLightboxPhoto(undefined)}
        slides={lightboxPhoto ? [lightboxPhoto] : undefined}
        plugins={[Zoom]}
        zoom={{ ref: zoomRef }}
        carousel={{ finite: true }}
        render={{ buttonPrev: () => null, buttonNext: () => null }}
        styles={{ root: { '--yarl__color_backdrop': 'rgba(0, 0, 0, .8)' } }}
        controller={{ closeOnBackdropClick: true, closeOnPullUp: true, closeOnPullDown: true }}
      />
    </div>
  )
}