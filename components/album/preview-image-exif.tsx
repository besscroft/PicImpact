'use client'

import { FrameIcon } from '~/components/icons/frame'
import * as React from 'react'
import type { ImageDataProps } from '~/types/props'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { CameraIcon } from '~/components/icons/camera'
import { ApertureIcon } from '~/components/icons/aperture'
import { TimerIcon } from '~/components/icons/timer'
import { CrosshairIcon } from '~/components/icons/crosshair'
import { GaugeIcon } from '~/components/icons/gauge'
import { ClockIcon } from '~/components/icons/clock'
import dayjs from 'dayjs'
import { TelescopeIcon } from '~/components/icons/telescope'
import { FlaskIcon } from '~/components/icons/flask'
import { toast } from 'sonner'
import { CopyIcon } from '~/components/icons/copy'
import { useTranslations } from 'next-intl'
import { ScrollArea } from '~/components/ui/scroll-area'
import HistogramChart from '~/components/album/histogram-chart'
import ToneAnalysis from '~/components/album/tone-analysis'

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

export default function PreviewImageExif(props: Readonly<ImageDataProps>) {
  const t = useTranslations()
  const exifIconClass = 'shrink-0 text-gray-500 dark:text-gray-50'
  const badgeIconClass = 'shrink-0 text-gray-500 dark:text-gray-400'

  // Use preview URL or original URL
  const imageUrl = props.data?.preview_url || props.data?.url || ''

  // Format date time
  const formattedDateTime = React.useMemo(() => {
    if (!props.data?.exif?.data_time) return null
    const parsed = dayjs(props.data.exif.data_time, 'YYYY:MM:DD HH:mm:ss')
    return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : props.data.exif.data_time
  }, [props.data?.exif?.data_time])

  // Calculate file info
  const dimensions = React.useMemo(() => {
    if (props.data?.width && props.data?.height) {
      return `${props.data.width} × ${props.data.height}`
    }
    return null
  }, [props.data?.width, props.data?.height])

  const megaPixels = React.useMemo(() => {
    if (props.data?.width && props.data?.height) {
      return `${((props.data.width * props.data.height) / 1_000_000).toFixed(1)} MP`
    }
    return null
  }, [props.data?.width, props.data?.height])

  return (
    <Dialog>
      <DialogTrigger>
        <FrameIcon
          className={exifIconClass}
          size={20}
        />
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-semibold">{t('Exif.title')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-80px)] pr-4">
          <div className="flex flex-col space-y-4">
            {/* Basic Information */}
            <div>
              <SectionTitle>{t('Exif.basicInfo')}</SectionTitle>
              <div className="space-y-1">
                <Row label={t('Exif.filename')} value={props.data?.title || props.data?.image_name} />
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

            {/* Labels/Tags - Badge style */}
            {props.data?.labels && props.data.labels.length > 0 && (
              <div>
                <SectionTitle>{t('Exif.tags')}</SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {props.data.labels.map((label: string, index: number) => (
                    <span 
                      key={index}
                      className="inline-flex items-center rounded-full border border-gray-200/50 bg-gray-100/50 px-2.5 py-1 text-xs text-gray-700 dark:border-gray-600/50 dark:bg-gray-700/50 dark:text-gray-200"
                    >
                      {label}
                    </span>
                  ))}
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
                <div className="space-y-1">
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
      </DialogContent>
    </Dialog>
  )
}
