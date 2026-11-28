export type View =
  | "dashboard"
  | "upload"
  | "photos"
  | "albums"
  | "storage"
  | "config"
  | "account";

export type Photo = {
  id: string;
  image_name: string | null;
  url: string | null;
  preview_url: string | null;
  video_url?: string | null;
  width: number;
  height: number;
  title: string | null;
  detail: string | null;
  exif?: Record<string, unknown> | null;
  labels?: string[] | null;
  blurhash?: string | null;
  lat?: string | null;
  lon?: string | null;
  show: number;
  show_on_mainpage: number;
  sort: number;
  createdAt?: string;
  type?: number;
  album_value?: string;
  album_name?: string;
};

export type AdminPhotoPage = {
  data: Photo[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};

export type Album = {
  id: string;
  album_value: string;
  name: string;
  detail: string | null;
  theme: string;
  show: number;
  sort: number;
  random_show: number;
  license: string | null;
  image_sorting: number;
  daily_weight: number;
};

export type Config = {
  config_key: string;
  config_value: string | null;
  detail: string | null;
};

export type PublicImage = Photo & {
  album_value?: string;
  album_name?: string;
  album_license?: string | null;
};

export type PublicImagePage = {
  data: PublicImage[];
  page: number;
  pageSize: number;
  total: number;
  pages: number;
};

export type PublicImageDetail = {
  data: PublicImage;
  neighbors: {
    previous: PublicImage | null;
    next: PublicImage | null;
  };
};

export type Dashboard = {
  summary: {
    totalImages: number;
    publicImages: number;
    totalAlbums: number;
    publicAlbums: number;
  };
  coverage: {
    publicRatio: number;
    featuredOnHome: number;
    geoTaggedImages: number;
    taggedImages: number;
  };
  recentUploads: PublicImage[];
  albumBreakdown: Array<{
    name: string;
    album_value: string;
    total: number;
    publicCount: number;
  }>;
  equipmentBreakdown: Array<{
    camera: string;
    lens: string;
    count: number;
  }>;
};
