'use client'

import React from 'react'
import { ImageHandleProps, ImageType } from '~/types'
import PhotoAlbum from 'react-photo-album'
import { Button } from '@nextui-org/react'
import { useSWRPageTotalHook } from '~/hooks/useSWRPageTotalHook'
import useSWRInfinite from 'swr/infinite'
import { motion } from 'framer-motion'

export default function Masonry(props : Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSWRPageTotalHook(props)
  const { data, error, isLoading, isValidating, size, setSize } = useSWRInfinite((index) => {
    return [`client--${index}-${props.tag}`, index]
    },
    ([_, index]) => {
      return props.handle(index + 1, props.tag)
    }, {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    })
  const dataList = data ? [].concat(...data) : [];
  return (
    <div className="w-full sm:w-4/5 mx-auto p-2">
      <PhotoAlbum
        columns={(containerWidth) => {
          if (containerWidth < 640) return 1;
          if (containerWidth < 768) return 2;
          if (containerWidth < 1024) return 3;
          return 4;
        }}
        layout="masonry"
        photos={
          dataList?.map((item: ImageType) => ({
            src: item.url,
            width: item.width,
            height: item.height,
            alt: item.detail
          })) || []
        }
        renderPhoto={({ imageProps: { src, alt, style, ...restImageProps } }) => (
          <motion.div
            style={style}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.5,
              ease: [0, 0.71, 0.2, 1.01]
            }}
          >
            <motion.img
              className="cursor-pointer"
              src={src}
              alt={alt}
              whileHover={{scale: 1.05}}
              whileTap={{scale: 0.95}}
            />
          </motion.div>
        )}
      />
      <div className="flex items-center justify-center my-4">
        {
          size < pageTotal ?
            <Button
              color="primary"
              variant="bordered"
              isLoading={isLoading}
              onClick={() => {
                setSize(size + 1)
              }}
            >
              加载更多
            </Button>
            :
            <></>
        }
      </div>
    </div>
  )
}