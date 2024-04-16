import { SVGProps } from 'react'

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type HandleProps = {
  handle: () => any
  args: string
}

export type HandleListProps = {
  handle: (pageNum: number) => any
  args: string
  totalHandle: () => any
}

export type TagType = {
  id: number;
  name: string;
  tag_value: string;
  detail: string;
  show: number;
  sort: number;
}

export type ExifType = {
  make: any;
  model: any;
  bits: any;
  data_time: any;
  exposure_time: any;
  f_number: any;
  exposure_program: any;
  iso_speed_rating: any;
  focal_length: any;
  lens_specification: any;
  lens_model: any;
  exposure_mode: any;
  cfa_pattern: any;
  color_space: any;
  white_balance: any;
}

export type ImageType = {
  id: number;
  url: string;
  exif: ExifType;
  tag: string;
  detail: string;
  show: number;
  sort: number;
  rating: number;
}