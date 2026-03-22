'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { useTranslations } from 'next-intl'
import Compressor from 'compressorjs'
import { heicTo, isHeic } from 'heic-to'
import { uploadFile } from '~/lib/utils/file'
import type { AlbumType } from '~/types'

export const STORAGE_OPTIONS = [
  {
    label: 'S3 API',
    value: 's3',
  },
  {
    label: 'Cloudflare R2',
    value: 'r2',
  },
  {
    label: 'Open List API',
    value: 'openList',
  }
]

export interface UploadConfig {
  storage: string
  setStorage: (value: string) => void
  album: string
  setAlbum: (value: string) => void
  openListStorage: Array<{ mount_path: string }>
  storageSelect: boolean
  openListMountPath: string
  setOpenListMountPath: (value: string) => void
  albums: AlbumType[] | undefined
  isAlbumsLoading: boolean
  previewCompressQuality: number
  previewImageMaxWidthLimitSwitchOn: boolean
  previewImageMaxWidthLimit: number
  maxUploadFiles: number
  handleStorageChange: (value: string) => Promise<void>
  resetStorageState: () => void
  isUploadDisabled: boolean
  uploadWithHeicConversion: (file: File, albumPath: string) => Promise<{ res: { code: number, data?: { url: string, imageId?: string, fileName?: string } }, processedFile: File }>
  compressPreviewImage: (file: File, type: string) => Promise<string>
}

export function useUploadConfig(): UploadConfig {
  const [openListStorage, setOpenListStorage] = useState<Array<{ mount_path: string }>>([])
  const [storageSelect, setStorageSelect] = useState(false)
  const [storage, setStorage] = useState('r2')
  const [album, setAlbum] = useState('')
  const [openListMountPath, setOpenListMountPath] = useState('')
  const t = useTranslations()

  const { data: albums, isLoading: isAlbumsLoading } = useSWR('/api/v1/albums', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/custom-info', fetcher)

  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')
  const maxUploadFiles = parseInt(configs?.find(config => config.config_key === 'max_upload_files')?.config_value || '5')

  const getOpenListStorage = useCallback(async () => {
    if (openListStorage.length > 0) {
      setStorageSelect(true)
      return
    }
    try {
      toast.info(t('Tips.gettingOpenListDirs'))
      const envelope = await fetch('/api/v1/storage/open-list/storages', {
        method: 'GET',
      }).then(res => res.json())
      if (envelope?.code === 200) {
        setOpenListStorage(envelope.data?.data?.content)
        setStorageSelect(true)
      } else {
        toast.error(t('Tips.getFailed'))
      }
    } catch {
      toast.error(t('Tips.getFailed'))
    }
  }, [openListStorage.length, t])

  const handleStorageChange = useCallback(async (value: string) => {
    setStorage(value)
    if (value === 'openList') {
      await getOpenListStorage()
    } else {
      setStorageSelect(false)
    }
  }, [getOpenListStorage])

  const resetStorageState = useCallback(() => {
    setStorageSelect(false)
    setOpenListMountPath('')
  }, [])

  const isUploadDisabled = storage === '' || album === '' || (storage === 'openList' && openListMountPath === '')

  const uploadWithHeicConversion = useCallback(async (file: File, albumPath: string) => {
    const fileName = file.name.split('.').slice(0, -1).join('.')
    let processedFile = file
    if (await isHeic(file)) {
      const outputBuffer: Blob | Blob[] = await heicTo({
        blob: file,
        type: 'image/jpeg',
      })
      const normalizedBlob: Blob = Array.isArray(outputBuffer)
        ? (outputBuffer[0] ?? new Blob())
        : outputBuffer
      processedFile = new File([normalizedBlob], fileName + '.jpg', { type: 'image/jpeg' })
    }
    const res = await uploadFile(processedFile, albumPath, storage, openListMountPath)
    if (res.code !== 200) {
      throw new Error('Upload failed')
    }
    return { res, processedFile }
  }, [storage, openListMountPath])

  const compressPreviewImage = useCallback((file: File, type: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: previewCompressQuality,
        checkOrientation: false,
        mimeType: 'image/webp',
        maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
        async success(compressedFile) {
          try {
            const res = await uploadFile(compressedFile, type, storage, openListMountPath)
            if (res?.code === 200) {
              resolve(res?.data?.url)
            } else {
              reject(new Error('Upload failed'))
            }
          } catch (e) {
            reject(e)
          }
        },
        error() {
          reject(new Error('Compression failed'))
        },
      })
    })
  }, [previewCompressQuality, previewImageMaxWidthLimitSwitchOn, previewImageMaxWidthLimit, storage, openListMountPath])

  return {
    storage,
    setStorage,
    album,
    setAlbum,
    openListStorage,
    storageSelect,
    openListMountPath,
    setOpenListMountPath,
    albums,
    isAlbumsLoading,
    previewCompressQuality,
    previewImageMaxWidthLimitSwitchOn,
    previewImageMaxWidthLimit,
    maxUploadFiles,
    handleStorageChange,
    resetStorageState,
    isUploadDisabled,
    uploadWithHeicConversion,
    compressPreviewImage,
  }
}
