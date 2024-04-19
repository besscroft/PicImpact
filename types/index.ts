export type HandleProps = {
  handle: () => any
  args: string
}

export type ImageServerHandleProps = {
  handle: (pageNum: number, tag: string) => any
  args: string
  totalHandle: (tag: string) => any
}

export type ImageHandleProps = {
  handle: (pageNum: number, tag: string) => any
  args: string
  tag: string
  totalHandle: (tag: string) => any
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
  width: number;
  height: number;
  tag: string;
  detail: string;
  show: number;
  sort: number;
  rating: number;
}