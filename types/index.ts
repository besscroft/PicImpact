export type DataProps = {
  data: any
}

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
  album: string
  totalHandle: (tag: string) => any
}

export type LinkProps = {
  handle: () => any
  args: string
  data: any
}

export type AlbumType = {
  id: string;
  name: string;
  album_value: string;
  detail: string;
  show: number;
  sort: number;
  allow_download: number;
  license: string;
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
  id: string;
  title: string;
  url: string;
  preview_url: string;
  video_url: string;
  exif: ExifType;
  labels: any;
  width: number;
  height: number;
  lon: string;
  lat: string;
  album: string;
  detail: string;
  type: number;
  show: number;
  sort: number;
  album_name: string;
  album_value: string;
  album_allow_download: number; // 映射自相册下载权限
  album_license: string;
  copyrights: any[];
}

export type CopyrightType = {
  id: string;
  name: string;
  social_name: string;
  type: string;
  url: string;
  avatar_url: string;
  detail: string;
  default: number;
  show: number;
}

export type Config = {
  id: string;
  config_key: string;
  config_value: string;
  detail: string;
}