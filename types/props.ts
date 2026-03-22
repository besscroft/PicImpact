// 业务专用类型

import { AlbumType, Config, ImageType } from '~/types/index'

export type AlbumDataProps = {
  data: AlbumType[]
  title?: string
}

export type HandleProps = {
  handle: () => Promise<unknown>
  args: string
}

export type ImageServerHandleProps = {
  handle: (pageNum: number, tag: string, showStatus?: number, camera?: string, lens?: string) => Promise<ImageType[]>
  args: string
  totalHandle: (tag: string, showStatus?: number, camera?: string, lens?: string) => Promise<number>
}

export type ImageHandleProps = {
  handle: (pageNum: number, album: string, camera?: string, lens?: string) => Promise<ImageType[]>
  args: string
  album: string
  totalHandle: (album: string, camera?: string, lens?: string) => Promise<number>
  configHandle?: () => Promise<Config[]>
}

export type PreviewImageHandleProps = {
  data: ImageType
  args: string
  id: string
  configHandle?: () => Promise<Config[]>
}

export type ProgressiveImageProps = {
  imageUrl: string, // 原始图片
  previewUrl: string, // 预览图
  width?: number,
  height?: number,
  blurhash: string,
  alt?: string,
  showLightbox?:boolean
  onShowLightboxChange?: (value: boolean) => void
}

export type LinkProps = {
  handle: () => Promise<unknown>
  args: string
  data: unknown
}

export type AlbumListProps = {
  data: AlbumType[]
}

export type ImageDataProps = {
  data: ImageType
}

export type ImageListDataProps = {
  data: ImageType[]
}

export type AnalysisDataProps = {
  data: {
    total: number;
    showTotal: number;
    tagsTotal: number;
    cameraStats: Array<{
      camera: string;
      lens: string;
      count: number;
    }>;
    result: Array<{
      name: string;
      value: string;
      total: number;
      show_total: number;
    }>;
  }
}