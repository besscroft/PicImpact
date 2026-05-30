// 业务专用类型

import { AlbumType, GalleryDisplayConfig, ImageType } from '~/types/index'

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
  configHandle?: () => Promise<GalleryDisplayConfig>
  // Variant CDN base resolved on the server (the same value `configHandle` will
  // return). Passed so the gallery has it on the very first client render,
  // before the client-side config SWR resolves — otherwise the grid briefly
  // sees an empty base, falls back to requesting `preview_url` thumbnails, then
  // swaps to AVIF once config arrives (a wasteful double-load that spiked mobile
  // memory). With this, the first render already serves AVIF variants.
  variantBaseUrl?: string
}

export type PreviewImageHandleProps = {
  data: ImageType
  args: string
  id: string
  configHandle?: () => Promise<GalleryDisplayConfig>
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
  // Variant fields so the high-res viewer can load the largest generated variant
  // (e.g. 2560 avif/webp) instead of the multi-MB original. Empty/missing → falls
  // back to imageUrl (the original).
  imageKey?: string
  readyMaxWidth?: number
  variantBaseUrl?: string
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