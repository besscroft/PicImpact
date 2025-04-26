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

export default function PreviewImageExif(props: Readonly<ImageDataProps>) {
  const exifIconClass = 'dark:text-gray-50 text-gray-500'
  const exifTextClass = 'text-tiny text-sm select-none items-center dark:text-gray-50 text-gray-500'

  return (
    <Dialog>
      <DialogTrigger>
        <FrameIcon
          className={exifIconClass}
          size={20}
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-142">
        <DialogHeader>
          <DialogTitle className="font-semibold">{props.data?.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-start space-x-2">
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
          <div className="flex flex-wrap space-x-2">
            {props.data?.exif?.lens_model &&
              <div className="flex items-center space-x-1">
                <TelescopeIcon className={exifIconClass} size={18} />
                <p className={exifTextClass}>
                  {props.data?.exif?.lens_model}
                </p>
              </div>
            }
            {props.data?.exif?.color_space &&
              <div className="flex items-center space-x-1">
                <FlaskIcon className={exifIconClass} size={18} />
                <p className={exifTextClass}>
                  {props.data?.exif?.color_space}
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
          <div className="flex w-full justify-end items-center">
            <CopyIcon
              className={exifIconClass}
              size={20}
              onClick={async () => {
                try {
                  const exif = JSON.stringify(props.data?.exif)
                  // @ts-ignore
                  await navigator.clipboard.writeText(exif)
                  toast.success('复制成功！', {duration: 1500})
                } catch (error) {
                  toast.error('复制失败！', {duration: 500})
                }
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}