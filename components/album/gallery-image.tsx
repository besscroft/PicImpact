'use client'

import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'
import type { ImageType } from '~/types'
import * as React from 'react'
import {
  Aperture,
  Camera,
  CircleGauge,
  Crosshair,
  Timer
} from 'lucide-react'

export default function GalleryImage({ photo }: { photo: ImageType }) {
  return (
    <div className="flex flex-col sm:flex-row w-full items-start justify-between">
      <div className="flex flex-1 flex-col px-2">
        <div className="flex space-x-2 py-1 sm:justify-end">
          <div className="font-semibold">{ photo.title }</div>
        </div>
      </div>
      <div className="relative inline-block select-none sm:w-[66.667%] mx-auto shadow-sm shadow-gray-200">
        <LazyLoadImage
          width={photo.width}
          height={photo.height}
          src={photo.url}
          alt={photo.title}
          effect="blur"
          wrapperProps={{
            style: {transitionDelay: "0.5s"},
          }}
        />
        {
          photo.type === 2 &&
          <div className="absolute top-2 left-2 p-5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute bottom-3 right-3 text-white opacity-75 z-10"
                 width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                 strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" fill="none"></path>
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="15.9" y1="20.11" x2="15.9" y2="20.12"></line>
              <line x1="19.04" y1="17.61" x2="19.04" y2="17.62"></line>
              <line x1="20.77" y1="14" x2="20.77" y2="14.01"></line>
              <line x1="20.77" y1="10" x2="20.77" y2="10.01"></line>
              <line x1="19.04" y1="6.39" x2="19.04" y2="6.4"></line>
              <line x1="15.9" y1="3.89" x2="15.9" y2="3.9"></line>
              <line x1="12" y1="3" x2="12" y2="3.01"></line>
              <line x1="8.1" y1="3.89" x2="8.1" y2="3.9"></line>
              <line x1="4.96" y1="6.39" x2="4.96" y2="6.4"></line>
              <line x1="3.23" y1="10" x2="3.23" y2="10.01"></line>
              <line x1="3.23" y1="14" x2="3.23" y2="14.01"></line>
              <line x1="4.96" y1="17.61" x2="4.96" y2="17.62"></line>
              <line x1="8.1" y1="20.11" x2="8.1" y2="20.12"></line>
              <line x1="12" y1="21" x2="12" y2="21.01"></line>
            </svg>
          </div>
        }
      </div>
      <div className="flex flex-wrap space-x-2 sm:space-x-0 sm:flex-col flex-1 px-2 py-1 sm:py-0 space-y-1 text-gray-500">
        {photo?.exif?.make && photo?.exif?.model &&
          <div className="flex items-center space-x-1">
            <Camera size={18}/>
            <p
              className="text-tiny text-sm select-none items-center"
            >
              {`${photo?.exif?.make} ${photo?.exif?.model}`}
            </p>
          </div>
        }
        {photo?.exif?.f_number &&
          <div className="flex items-center space-x-1">
            <Aperture size={18}/>
            <p
              className="text-tiny text-sm select-none items-center"
            >
              {`${photo?.exif?.f_number}`}
            </p>
          </div>
        }
        {photo?.exif?.exposure_time &&
          <div className="flex items-center space-x-1">
            <Timer size={18}/>
            <p
              className="text-tiny text-sm select-none items-center"
            >
              {`${photo?.exif?.exposure_time}`}
            </p>
          </div>
        }
        {photo?.exif?.focal_length &&
          <div className="flex items-center space-x-1">
            <Crosshair size={18}/>
            <p
              className="text-tiny text-sm select-none items-center"
            >
              {`${photo?.exif?.focal_length}`}
            </p>
          </div>
        }
        {photo?.exif?.iso_speed_rating &&
          <div className="flex items-center space-x-1">
            <CircleGauge size={18}/>
            <p
              className="text-tiny text-sm select-none items-center"
            >
              {`${photo?.exif?.iso_speed_rating}`}
            </p>
          </div>
        }
      </div>
    </div>
  )
}