'use client'

import type { HandleProps, PreviewImageHandleProps } from '~/types/props'
import LivePhoto from '~/components/album/live-photo'
import { toast } from 'sonner'
import { LinkIcon } from '~/components/icons/link'
import { DownloadIcon } from '~/components/icons/download'
import dayjs from 'dayjs'
import useSWR from 'swr'
import { useRouter } from 'next-nprogress-bar'
import { CameraIcon } from '~/components/icons/camera'
import { ApertureIcon } from '~/components/icons/aperture'
import { TimerIcon } from '~/components/icons/timer'
import { CrosshairIcon } from '~/components/icons/crosshair'
import { GaugeIcon } from '~/components/icons/gauge'
import { XIcon } from '~/components/icons/x'
import { Badge } from '~/components/ui/badge'
import { LanguagesIcon } from '~/components/icons/languages'
import { CopyIcon } from '~/components/icons/copy'
import { RefreshCWIcon } from '~/components/icons/refresh-cw'
import { cn } from '~/lib/utils'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import { useMemo, useState } from 'react'
import { ExpandIcon } from '~/components/icons/expand'
import { useTranslations } from 'next-intl'
import ProgressiveImage from '~/components/album/progressive-image.tsx'
import ToneAnalysis from '~/components/album/tone-analysis'
import HistogramChart from '~/components/album/histogram-chart'
import { Separator } from '~/components/ui/separator'
import { TelescopeIcon } from '~/components/icons/telescope'
import { FlaskIcon } from '~/components/icons/flask'
import { ScrollArea } from '~/components/ui/scroll-area'

// Row component for unified key-value display
function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="shrink-0 text-gray-500 dark:text-gray-400">{label}</span>
      <span className="min-w-0 text-right text-gray-700 dark:text-gray-50">{value}</span>
    </div>
  )
}

// Badge component for capture parameters
function ParamBadge({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex h-7 items-center gap-2 rounded-md border border-gray-200/50 bg-gray-100/50 px-2.5 dark:border-gray-600/50 dark:bg-gray-700/50">
      {icon}
      <span className="text-xs text-gray-700 dark:text-gray-200">{value}</span>
    </div>
  )
}

// Section title component
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
      {children}
    </h4>
  )
}

export default function PreviewImage(props: Readonly<PreviewImageHandleProps>) {
  const router = useRouter()
  const t = useTranslations()
  const { data: download = false, mutate: setDownload } = useSWR(['masonry/download', props.data?.url ?? ''], null)
  const [lightboxPhoto, setLightboxPhoto] = useState<boolean>(false)

  const exifIconClass = 'dark:text-gray-50 text-gray-500'
  const badgeIconClass = 'shrink-0 text-gray-500 dark:text-gray-400'

  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps)

  // Format date time
  const formattedDateTime = useMemo(() => {
    if (!props.data?.exif?.data_time) return null
    const parsed = dayjs(props.data.exif.data_time, 'YYYY:MM:DD HH:mm:ss')
    return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : props.data.exif.data_time
  }, [props.data?.exif?.data_time])

  // Calculate file info
  const dimensions = useMemo(() => {
    if (props.data?.width && props.data?.height) {
      return `${props.data.width} × ${props.data.height}`
    }
    return null
  }, [props.data?.width, props.data?.height])

  const megaPixels = useMemo(() => {
    if (props.data?.width && props.data?.height) {
      return `${((props.data.width * props.data.height) / 1_000_000).toFixed(1)} MP`
    }
    return null
  }, [props.data?.width, props.data?.height])

  // Image URL for tone analysis and histogram
  const imageUrl = props.data?.preview_url || props.data?.url || ''

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
      let response = await fetch(`/api/public/download/${props.id}?storage=${storageType}`)
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        // 如果是 JSON 响应，说明是直接下载模式
        const data = await response.json()
        // 使用后端返回的文件名，并进行 URL 解码
        const filename = decodeURIComponent(data.filename || 'download.jpg')
        // 直接使用 window.location.href 触发下载
        response = await fetch(data.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(new Blob([blob]))
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // 对于非直接下载模式，从 Content-Disposition 头中获取文件名
        const contentDisposition = response.headers.get('content-disposition')
        let filename = 'download'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
          if (filenameMatch) {
            filename = decodeURIComponent(filenameMatch[1])
          }
        }
        const blob = await response.blob()
        const url = window.URL.createObjectURL(new Blob([blob]))
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
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
    <div className="flex flex-col overflow-y-auto scrollbar-hide h-full rounded-none! max-w-none gap-0 p-2">
      <div className="relative h-full flex flex-col space-y-2 sm:grid sm:gap-4 sm:grid-cols-3 w-full">
        <div className="show-up-motion sm:col-span-2 sm:flex sm:justify-center sm:max-h-[90vh] select-none">
          {
            props.data.type === 1 ?
              <ProgressiveImage 
                imageUrl={props.data.url}
                previewUrl={props.data.preview_url}
                alt={props.data.title}
                height={props.data.height}
                width={props.data.width}
                blurhash={props.data.blurhash}
                showLightbox={lightboxPhoto}
                onShowLightboxChange={(value)=>setLightboxPhoto(value)}
              />
              : <LivePhoto
                url={props.data.preview_url || props.data.url}
                videoUrl={props.data.video_url}
                className="md:h-[90vh] md:max-h-[90vh]"
              />
          }
        </div>
        
        {/* Right side panel with all EXIF info */}
        <ScrollArea className="sm:max-h-[90vh]">
          <div className="flex w-full flex-col space-y-4 pr-4">
            {/* Header with title and close button */}
            <div className="flex items-center justify-between">
              <div className="flex-1 font-semibold text-lg">{props.data?.title}</div>
              <button
                onClick={handleClose}
                className="z-50"
                aria-label={t('Button.goBack')}
              >
                <XIcon className={exifIconClass} size={18} />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <CopyIcon
                className={cn(exifIconClass, 'cursor-pointer')}
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
                className={cn(exifIconClass, 'cursor-pointer')}
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
                      className={cn(exifIconClass, 'cursor-pointer')}
                      size={20}
                      onClick={() => handleDownload()}
                    />
                  }
                </>
              }
              <ExpandIcon
                className={cn(exifIconClass, 'cursor-pointer')}
                size={20}
                onClick={() => {
                  setLightboxPhoto(true)
                }}
              />
            </div>

            <Separator className="dark:bg-gray-700" />

            {/* Basic Information */}
            <div>
              <SectionTitle>{t('Exif.basicInfo')}</SectionTitle>
              <div className="space-y-1">
                {dimensions && <Row label={t('Exif.dimensions')} value={dimensions} />}
                {megaPixels && <Row label={t('Exif.pixels')} value={megaPixels} />}
                <Row label={t('Exif.captureTime')} value={formattedDateTime} />
                {props.data?.exif?.color_space && (
                  <Row label={t('Exif.colorSpace')} value={props.data.exif.color_space} />
                )}
              </div>
            </div>

            {/* Capture Parameters - Badge style */}
            {(props.data?.exif?.focal_length || props.data?.exif?.f_number || 
              props.data?.exif?.exposure_time || props.data?.exif?.iso_speed_rating) && (
              <div>
                <SectionTitle>{t('Exif.captureParams')}</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  {props.data?.exif?.focal_length && (
                    <ParamBadge 
                      icon={<CrosshairIcon className={badgeIconClass} size={14} />}
                      value={props.data.exif.focal_length}
                    />
                  )}
                  {props.data?.exif?.f_number && (
                    <ParamBadge 
                      icon={<ApertureIcon className={badgeIconClass} size={14} />}
                      value={props.data.exif.f_number}
                    />
                  )}
                  {props.data?.exif?.exposure_time && (
                    <ParamBadge 
                      icon={<TimerIcon className={badgeIconClass} size={14} />}
                      value={props.data.exif.exposure_time}
                    />
                  )}
                  {props.data?.exif?.iso_speed_rating && (
                    <ParamBadge 
                      icon={<GaugeIcon className={badgeIconClass} size={14} />}
                      value={`ISO ${props.data.exif.iso_speed_rating}`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Tone Analysis */}
            {imageUrl && (
              <div>
                <SectionTitle>{t('Exif.toneAnalysis')}</SectionTitle>
                <ToneAnalysis imageUrl={imageUrl} />
              </div>
            )}

            {/* Histogram */}
            {imageUrl && (
              <div>
                <SectionTitle>{t('Exif.histogram')}</SectionTitle>
                <HistogramChart imageUrl={imageUrl} />
              </div>
            )}

            {/* Device Information */}
            {(props.data?.exif?.make || props.data?.exif?.model || props.data?.exif?.lens_model) && (
              <div>
                <SectionTitle>{t('Exif.deviceInfo')}</SectionTitle>
                <div className="space-y-1.5">
                  {props.data?.exif?.make && props.data?.exif?.model && (
                    <div className="flex items-center gap-2">
                      <CameraIcon className={badgeIconClass} size={14} />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {`${props.data.exif.make} ${props.data.exif.model}`}
                      </span>
                    </div>
                  )}
                  {props.data?.exif?.lens_model && (
                    <div className="flex items-center gap-2">
                      <TelescopeIcon className={badgeIconClass} size={14} />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {props.data.exif.lens_model}
                      </span>
                    </div>
                  )}
                  {props.data?.exif?.focal_length && (
                    <Row label={t('Exif.focalLength')} value={props.data.exif.focal_length} />
                  )}
                </div>
              </div>
            )}

            {/* Capture Mode */}
            {(props.data?.exif?.exposure_mode || props.data?.exif?.exposure_program ||
              props.data?.exif?.white_balance) && (
              <div>
                <SectionTitle>{t('Exif.captureMode')}</SectionTitle>
                <div className="space-y-1">
                  {props.data?.exif?.exposure_program && (
                    <Row label={t('Exif.exposureProgram')} value={props.data.exif.exposure_program} />
                  )}
                  <Row label={t('Exif.exposureMode')} value={props.data?.exif?.exposure_mode} />
                  <Row label={t('Exif.whiteBalance')} value={props.data?.exif?.white_balance} />
                  {props.data?.exif?.color_space && (
                    <div className="flex items-center gap-2">
                      <FlaskIcon className={badgeIconClass} size={14} />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {props.data.exif.color_space}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Technical Parameters */}
            {(props.data?.exif?.bits || props.data?.exif?.cfa_pattern) && (
              <div>
                <SectionTitle>{t('Exif.technicalParams')}</SectionTitle>
                <div className="space-y-1">
                  {props.data?.exif?.bits && (
                    <Row label={t('Exif.bitDepth')} value={props.data.exif.bits} />
                  )}
                  {props.data?.exif?.cfa_pattern && (
                    <Row label={t('Exif.cfaPattern')} value={props.data.exif.cfa_pattern} />
                  )}
                </div>
              </div>
            )}

            {/* Labels/Tags */}
            {props.data?.labels && props.data.labels.length > 0 && (
              <div>
                <SectionTitle>{t('Exif.tags')}</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {props.data.labels.map((tag: string) => (
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
              </div>
            )}

            {/* Description */}
            {props.data?.detail && (
              <div>
                <div className="flex items-start gap-2">
                  <LanguagesIcon className={badgeIconClass} size={14} />
                  <p className="text-sm text-gray-700 dark:text-gray-200 text-wrap">
                    {props.data.detail}
                  </p>
                </div>
              </div>
            )}

            {/* Copy EXIF button */}
            <div className="flex w-full items-center justify-end pt-2">
              <button
                className="flex items-center space-x-1 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={async () => {
                  try {
                    const exif = JSON.stringify(props.data?.exif, null, 2)
                    await navigator.clipboard.writeText(exif)
                    toast.success(t('Exif.copySuccess'), { duration: 1500 })
                  } catch {
                    toast.error(t('Exif.copyFailed'), { duration: 500 })
                  }
                }}
              >
                <CopyIcon className={exifIconClass} size={16} />
                <span>{t('Exif.copyExif')}</span>
              </button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
