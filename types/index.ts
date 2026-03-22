// 数据库表结构类型

export type AlbumType = {
  id: string;
  name: string;
  album_value: string;
  detail: string | null;
  theme: string;
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
  make: string | undefined;
  model: string | undefined;
  bits: string | undefined;
  data_time: string | undefined;
  exposure_time: string | undefined;
  f_number: string | undefined;
  exposure_program: string | undefined;
  iso_speed_rating: string | undefined;
  focal_length: string | undefined;
  lens_specification: string | undefined;
  lens_model: string | undefined;
  exposure_mode: string | undefined;
  cfa_pattern: string | undefined;
  color_space: string | undefined;
  white_balance: string | undefined;
}

export type ImageType = {
  id: string;
  image_name: string;
  title: string;
  url: string;
  preview_url: string;
  video_url: string;
  blurhash: string;
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
