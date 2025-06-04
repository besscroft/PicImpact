// 数据库表结构类型

export type AlbumType = {
  id: string;
  name: string;
  album_value: string;
  detail: string | null;
  show: number;
  sort: number;
  license: string | null;
  image_sorting: number;
  random_show: number;
  del?: number;
  createdAt?: Date;
  updatedAt?: Date | null;
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
  type: number; // type: 图片类型为 1，livephoto 类型为 2
  show: number;
  show_on_mainpage: number;
  sort: number;
  album_name: string;
  album_value: string;
  album_license: string;
}

export type Config = {
  id: string;
  config_key: string;
  config_value: string | null;
  detail: string | null;
}
