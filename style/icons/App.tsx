import React from 'react'
import { IconSvgProps } from '~/types'

export const AppIcon : React.FC<IconSvgProps> = ({
  size  = 32,
  height = 32,
  width = 32,
  fill = 'currentColor',
  ...props
}) => {
  return (
    <svg
      height={size || height}
      viewBox="0 0 32 32"
      width={size || width}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M28 10h-6v14h2v-4h4a2.003 2.003 0 0 0 2-2v-6a2.002 2.002 0 0 0-2-2m-4 8v-6h4v6zm-6-8h-6v14h2v-4h4a2.003 2.003 0 0 0 2-2v-6a2.002 2.002 0 0 0-2-2m-4 8v-6h4v6zm-6-8H3v2h5v2H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6v-8a2.002 2.002 0 0 0-2-2m0 8H4v-2h4z"
      />
    </svg>
  );
};