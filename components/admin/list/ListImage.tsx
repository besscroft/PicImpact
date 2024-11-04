'use client'

import React from 'react'

export default function ListImage({ image }: { image: any }) {
  return (
    <img
      className="duration-700 ease-in-out group-hover:opacity-75 w-full h-full object-contain"
      src={image.preview_url || image.url}
      alt={image.detail}
    />
  )
}