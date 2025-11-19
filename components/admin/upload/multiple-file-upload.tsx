'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { AlbumType, ImageType } from '~/types'
import Compressor from 'compressorjs'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { useTranslations } from 'next-intl'
import { exifReader, uploadFile } from '~/lib/utils/file'
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem, FileUploadItemDelete, FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList
} from '~/components/ui/file-upload'
import { UploadIcon } from '~/components/icons/upload'
import { Button } from '~/components/ui/button'
import { X } from 'lucide-react'
import { heicTo, isHeic } from 'heic-to'
import { encodeBrowserThumbHash } from '~/lib/utils/blurhash-client'

export default function MultipleFileUpload() {
  const [openListStorage, setOpenListStorage] = useState([])
  const [storageSelect, setStorageSelect] = useState(false)
  const [storage, setStorage] = useState('r2')
  const [album, setAlbum] = useState('')
  const [openListMountPath, setOpenListMountPath] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const t = useTranslations()

  const { data, isLoading } = useSWR('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')
  const maxUploadFiles = parseInt(configs?.find(config => config.config_key === 'max_upload_files')?.config_value || '5')

  async function getOpenListStorage() {
    if (openListStorage.length > 0) {
      setStorageSelect(true)
      return
    }
    try {
      toast.info('正在获取 Open List 挂载目录')
      const res = await fetch('/api/v1/storage/open-list/storages', {
        method: 'GET',
      }).then(res => res.json())
      if (res?.code === 200) {
        setOpenListStorage(res.data?.content)
        setStorageSelect(true)
      } else {
        toast.error('获取失败')
      }
    } catch (e) {
      toast.error('获取失败')
    }
  }

  const storages = [
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

  async function autoSubmit(file: any, url: string, previewUrl: string) {
    try {
      if (album === '') {
        toast.warning('请先选择相册！')
        return
      }
      const { tags, exifObj } = await exifReader(file)
      if (tags?.GPSLatitude?.description) {
        setLat(tags?.GPSLatitude?.description)
      } else {
        setLat('')
      }
      if (tags?.GPSLongitude?.description) {
        setLon(tags?.GPSLongitude?.description)
      } else {
        setLon('')
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = async () => {
          const hash = await encodeBrowserThumbHash(file)
          const data = {
            album: album,
            url: url,
            title: '',
            preview_url: previewUrl,
            blurhash: hash,
            exif: exifObj,
            labels: [],
            detail: '',
            width: Number(img.width),
            height: Number(img.height),
            lat: lat,
            lon: lon,
          } as ImageType
          const res = await fetch('/api/v1/images/add', {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'post',
            // @ts-ignore
            body: JSON.stringify(data),
          }).then(res => res.json())
          if (res?.code === 200) {
            toast.success('保存成功')
          } else {
            toast.error('保存失败')
          }
        }
        // @ts-ignore
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    } catch (e) {
      console.error(e)
      throw new Error('Upload failed')
    }
  }

  async function uploadPreviewImage(file: File, type: string, url: string) {
    new Compressor(file, {
      quality: previewCompressQuality,
      checkOrientation: false,
      mimeType: 'image/webp',
      maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
      async success(compressedFile) {
        const res = await uploadFile(compressedFile, type, storage, openListMountPath)
        if (res?.code === 200) {
          await autoSubmit(file, url, res?.data?.url)
        } else {
          throw new Error('Upload failed')
        }
      },
      error() {
        throw new Error('Upload failed')
      },
    })
  }

  async function resHandle(res: any, file: File) {
    try {
      if (album === '/') {
        await uploadPreviewImage(file, '/preview', res?.data?.url)
      } else {
        await uploadPreviewImage(file, album + '/preview', res?.data?.url)
      }
    } catch (e) {
      throw new Error('Upload failed')
    }
  }

  async function onRequestUpload(file: File) {
    // 获取文件名但是去掉扩展名部分
    const fileName = file.name.split('.').slice(0, -1).join('.')
    if (await isHeic(file)) {
      // 把 HEIC 转成 JPEG
      const outputBuffer: Blob | Blob[] = await heicTo({
        blob: file,
        type: 'image/jpeg',
      })
      const outputFile = new File([outputBuffer], fileName + '.jpg', { type: 'image/jpeg' })// 添加文件名
      // @ts-ignore
      new Compressor(outputFile, {
        quality: previewCompressQuality,
        checkOrientation: false,
        mimeType: 'image/jpeg',
        maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
        async success(compressedFile) {
          await uploadFile(compressedFile, album, storage, openListMountPath).then(async (res) => {
            if (res.code === 200) {
              await resHandle(res, outputFile)
            } else {
              throw new Error('Upload failed')
            }
          })
        }
      })
    } else {
      await uploadFile(file, album, storage, openListMountPath).then(async (res) => {
        if (res.code === 200) {
          await resHandle(res, file)
        } else {
          throw new Error('Upload failed')
        }
      })
    }
  }

  function onRemoveFile() {
    setStorageSelect(false)
    setOpenListMountPath('')
    setLat('')
    setLon('')
  }

  const onUpload = React.useCallback(
    async (
      files: File[],
      {
        onSuccess,
        onError,
      }: {
        onSuccess: (file: File) => void;
        onError: (file: File, error: Error) => void;
      },
    ) => {
      try {
        // Process each file individually
        const uploadPromises = files.map(async (file) => {
          try {
            await onRequestUpload(file)
            onSuccess(file)
          } catch (error) {
            onError(
              file,
              error instanceof Error ? error : new Error('Upload failed'),
            )
            throw new Error('Upload failed')
          }
        })

        toast.promise(() => Promise.all(uploadPromises), {
          loading: t('Upload.uploading'),
          success: () => {
            return t('Upload.uploadSuccess')
          },
          error: t('Upload.uploadError'),
        })
      } catch (error) {
        // This handles any error that might occur outside the individual upload processes
        console.error('Unexpected error during upload:', error)
        toast.error('Upload failed')
      }
    },
    [onRequestUpload],
  )

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <div className="flex space-x-2 flex-wrap space-y-1">
        <Select
          disabled={isLoading}
          value={storage}
          onValueChange={async (value: string) => {
            setStorage(value)
            if (value === 'openList') {
              await getOpenListStorage()
            } else {
              setStorageSelect(false)
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Upload.selectStorage')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{t('Words.album')}</SelectLabel>
              {storages?.map((storage: any) => (
                <SelectItem key={storage.value} value={storage.value}>
                  {storage.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          disabled={isLoading}
          defaultValue={album}
          onValueChange={(value: string) => setAlbum(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Upload.selectAlbum')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{t('Words.album')}</SelectLabel>
              {data?.map((album: AlbumType) => (
                <SelectItem key={album.album_value} value={album.album_value}>
                  {album.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {
          storage === 'openList' && storageSelect && openListStorage?.length > 0 && (
            <Select
              disabled={isLoading}
              defaultValue={openListMountPath}
              onValueChange={(value: string) => setOpenListMountPath(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('Upload.selectOpenListDirectory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('Upload.openListDirectory')}</SelectLabel>
                {openListStorage?.map((storage: any) => (
                  <SelectItem key={storage?.mount_path} value={storage?.mount_path}>
                    {storage?.mount_path}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>
      <FileUpload
        value={files}
        onValueChange={setFiles}
        onUpload={onUpload}
        maxFiles={maxUploadFiles}
        multiple={true}
        disabled={storage === '' || album === '' || (storage === 'openList' && openListMountPath === '')}
      >
        <FileUploadDropzone className="h-full">
          <div className="flex flex-col items-center gap-1">
            <UploadIcon/>
            <p className="font-medium text-sm">{t('Upload.uploadTips1')}</p>
            <p className="text-muted-foreground text-xs">
              {t('Upload.uploadTips2')}
            </p>
            <p className="text-muted-foreground text-xs">
              {t('Upload.uploadTips4', { count: maxUploadFiles })}
            </p>
          </div>
        </FileUploadDropzone>
        <FileUploadList>
          {files.map((file, index) => (
            <FileUploadItem key={index} value={file}>
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemDelete asChild>
                <Button onClick={() => onRemoveFile()} variant="ghost" size="icon" className="size-7">
                  <X />
                </Button>
              </FileUploadItemDelete>
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload>
    </div>
  )
}

