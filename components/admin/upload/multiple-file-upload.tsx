'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import type { AlbumType, ImageType } from '~/types'
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
import { exifReader } from '~/lib/utils/file'
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
import { encodeBrowserThumbHash } from '~/lib/utils/blurhash-client'
import { useUploadConfig, STORAGE_OPTIONS } from '~/hooks/use-upload-config'

export default function MultipleFileUpload() {
  const {
    storage,
    album,
    setAlbum,
    openListStorage,
    storageSelect,
    openListMountPath,
    setOpenListMountPath,
    albums,
    isAlbumsLoading,
    maxUploadFiles,
    handleStorageChange,
    resetStorageState,
    isUploadDisabled,
    uploadWithHeicConversion,
    compressPreviewImage,
  } = useUploadConfig()

  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const t = useTranslations()

  async function autoSubmit(file: File, url: string, previewUrl: string) {
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
          const res = await fetch('/api/v1/images', {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'post',
            // @ts-expect-error
            body: JSON.stringify(data),
          }).then(res => res.json())
          if (res?.code === 200) {
            toast.success('保存成功')
          } else {
            toast.error('保存失败')
          }
        }
        // @ts-expect-error
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    } catch (e) {
      console.error(e)
      throw new Error('Upload failed')
    }
  }

  async function onRequestUpload(file: File) {
    const { res, processedFile } = await uploadWithHeicConversion(file, album)
    const previewType = album === '/' ? '/preview' : album + '/preview'
    try {
      const previewResultUrl = await compressPreviewImage(processedFile, previewType)
      await autoSubmit(processedFile, res?.data?.url, previewResultUrl)
    } catch (e) {
      throw new Error('Upload failed')
    }
  }

  function onRemoveFile() {
    resetStorageState()
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
          disabled={isAlbumsLoading}
          value={storage}
          onValueChange={handleStorageChange}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Upload.selectStorage')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{t('Words.album')}</SelectLabel>
              {STORAGE_OPTIONS?.map((storage) => (
                <SelectItem key={storage.value} value={storage.value}>
                  {storage.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          disabled={isAlbumsLoading}
          defaultValue={album}
          onValueChange={(value: string) => setAlbum(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('Upload.selectAlbum')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{t('Words.album')}</SelectLabel>
              {albums?.map((album: AlbumType) => (
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
              disabled={isAlbumsLoading}
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
        disabled={isUploadDisabled}
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
