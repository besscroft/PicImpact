'use client'

import { useBlurImageDataUrl } from '~/hooks/use-blurhash.ts'
import { MotionImage } from '~/components/album/motion-image'

export default function ListImage({ image }: { image: any }) {

  const dataURL = useBlurImageDataUrl(image.blurhash)
  
  return (
    <MotionImage
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="duration-700 ease-in-out group-hover:opacity-75 w-full h-full object-contain"
      src={image.preview_url || image.url}
      overrideSrc={image.preview_url || image.url}
      alt={image.title}
      width={image.width}
      height={image.height}
      loading="lazy"
      unoptimized
      placeholder="blur"
      blurDataURL={dataURL}
    />
  )
}