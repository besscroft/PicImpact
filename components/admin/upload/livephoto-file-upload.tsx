'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import type { ExifType, AlbumType, ImageType } from '~/types'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Tag, TagInput } from 'emblor'
import { useTranslations } from 'next-intl'
import { exifReader, uploadFile } from '~/lib/utils/file'
import { RocketIcon } from '~/components/icons/rocket'
import { RefreshCWIcon } from '~/components/icons/refresh-cw'
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem, FileUploadItemDelete, FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList
} from '~/components/ui/file-upload'
import { Button } from '~/components/ui/button'
import { X } from 'lucide-react'
import { UploadIcon } from '~/components/icons/upload'
import { encodeBrowserThumbHash } from '~/lib/utils/blurhash-client'
import { useUploadConfig, STORAGE_OPTIONS } from '~/hooks/use-upload-config'

export default function LivephotoFileUpload() {
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
    handleStorageChange,
    resetStorageState,
    isUploadDisabled,
    uploadWithHeicConversion,
    compressPreviewImage,
  } = useUploadConfig()

  const [exif, setExif] = useState({} as ExifType)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [hash, setHash] = useState('')
  const [detail, setDetail] = useState('')
  const [imageLabels, setImageLabels] = useState([] as string[])
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  const t = useTranslations()

  async function loadExif(file: File) {
    try {
      const fileBuffer = await file.arrayBuffer()
      const { tags, exifObj } = await exifReader(fileBuffer)
      setExif(exifObj)
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
    } catch (e) {
      console.error(e)
    }
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          setWidth(Number(img.width))
          setHeight(Number(img.height))
        }
        if (e.target && typeof e.target.result === 'string') {
          img.src = e.target.result
        }
      }
      reader.readAsDataURL(file)
    } catch (e) {
      console.error(e)
    }
  }

  async function submit() {
    try {
      setLoading(true)
      if (!url || url === '') {
        toast.warning('请先上传文件！')
        return
      }
      if (album === '') {
        toast.warning('请先选择相册！')
        return
      }
      if (!height || height <= 0) {
        toast.warning('图片高度不能为空且必须大于 0！')
        return
      }
      if (!width || width <= 0) {
        toast.warning('图片宽度不能为空且必须大于 0！')
        return
      }
      const data = {
        album: album,
        url: url,
        title: title,
        preview_url: previewUrl,
        blurhash: hash,
        video_url: videoUrl,
        exif: exif,
        labels: imageLabels,
        detail: detail,
        width: width,
        height: height,
        type: 2,
        lat: lat,
        lon: lon,
      } as ImageType
      const res = await fetch('/api/v1/images', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'post',
        body: JSON.stringify(data),
      }).then(res => res.json())
      if (res?.code === 200) {
        toast.success('保存成功')
      } else {
        toast.error('保存失败')
      }
    } catch (e) {
      toast.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  async function onRequestImageUpload(file: File) {
    const { res, processedFile } = await uploadWithHeicConversion(file, album)
    const previewType = album === '/' ? '/preview' : album + '/preview'
    try {
      const previewResultUrl = await compressPreviewImage(processedFile, previewType)
      setPreviewUrl(previewResultUrl)
    } catch (e) {
      console.error('Failed to upload preview image:', e)
    }
    await loadExif(processedFile)
    setHash(await encodeBrowserThumbHash(processedFile))
    setUrl(res?.data?.url)
  }

  async function onRequestVideoUpload(file: File) {
    const res = await uploadFile(file, album, storage, openListMountPath)
    if (res?.code === 200) {
      setVideoUrl(res?.data?.url)
    } else {
      throw new Error('Upload failed')
    }
  }

  async function onBeforeUpload(type: number) {
    if (type === 1) {
      setTitle('')
      setPreviewUrl('')
      setVideoUrl('')
      setImageLabels([])
    }
  }

  function onRemoveFile() {
    resetStorageState()
    setExif({} as ExifType)
    setHash('')
    setUrl('')
    setTitle('')
    setDetail('')
    setWidth(0)
    setHeight(0)
    setLat('')
    setLon('')
    setPreviewUrl('')
    setVideoUrl('')
    setImageLabels([])
  }

  const [images, setImages] = React.useState<File[]>([])
  const [videos, setVideos] = React.useState<File[]>([])

  const onImageUpload = React.useCallback(
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
            await onBeforeUpload(1)
            await onRequestImageUpload(file)
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
    [onRequestImageUpload],
  )

  const onVideoUpload = React.useCallback(
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
        toast.info('Uploading files...')
        // Process each file individually
        const uploadPromises = files.map(async (file) => {
          try {
            await onBeforeUpload(2)
            await onRequestVideoUpload(file)
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
    [onRequestVideoUpload],
  )

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <div className="flex space-x-2">
        <div className="flex flex-1 w-full space-x-1">
          <Select
            defaultValue={storage}
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
        </div>
        {loading ?
          <RefreshCWIcon
            size={20}
            className="animate-spin cursor-not-allowed"
          /> :
          <RocketIcon
            size={20}
            onClick={() => submit()}
            aria-label={t('Button.submit')}
          />
        }
      </div>
      {
        storageSelect && openListStorage?.length > 0 &&
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
      }
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col space-y-2">
          <FileUpload
            maxFiles={1}
            className="w-full h-full"
            value={images}
            onValueChange={setImages}
            onUpload={onImageUpload}
            multiple={false}
            disabled={isUploadDisabled}
          >
            <FileUploadDropzone className="h-full">
              <div className="flex flex-col items-center gap-1">
                <UploadIcon/>
                <p className="font-medium text-sm">Drag & drop image here</p>
                <p className="text-muted-foreground text-xs">
                  Or click to browse (max 1 files)
                </p>
              </div>
            </FileUploadDropzone>
            <FileUploadList>
              {images.map((file, index) => (
                <FileUploadItem key={index} value={file}>
                  <FileUploadItemPreview/>
                  <FileUploadItemMetadata/>
                  <FileUploadItemDelete asChild>
                    <Button onClick={() => onRemoveFile()} variant="ghost" size="icon" className="size-7">
                      <X/>
                    </Button>
                  </FileUploadItemDelete>
                </FileUploadItem>
              ))}
            </FileUploadList>
          </FileUpload>
          <FileUpload
            maxFiles={1}
            className="w-full h-full"
            value={videos}
            onValueChange={setVideos}
            onUpload={onVideoUpload}
            multiple={false}
            disabled={isUploadDisabled}
          >
            <FileUploadDropzone className="h-full">
              <div className="flex flex-col items-center gap-1">
                <UploadIcon/>
                <p className="font-medium text-sm">Drag & drop video here</p>
                <p className="text-muted-foreground text-xs">
                  Or click to browse (max 1 files)
                </p>
              </div>
            </FileUploadDropzone>
            <FileUploadList>
              {videos.map((file, index) => (
                <FileUploadItem key={index} value={file}>
                  <FileUploadItemPreview/>
                  <FileUploadItemMetadata/>
                  <FileUploadItemDelete asChild>
                    <Button onClick={() => onRemoveFile()} variant="ghost" size="icon" className="size-7">
                      <X/>
                    </Button>
                  </FileUploadItemDelete>
                </FileUploadItem>
              ))}
            </FileUploadList>
          </FileUpload>
        </div>
        <div className="w-full space-y-2">
          <label
            htmlFor="title"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('Upload.title')} </span>

            <input
              type="text"
              id="title"
              value={title}
              placeholder={t('Upload.inputTitle')}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="url"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('Upload.url')} </span>

            <input
              type="text"
              id="url"
              disabled
              value={url}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          {previewUrl && previewUrl !== '' &&
            <label
              htmlFor="previewUrl"
              className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            >
              <span className="text-xs font-medium text-gray-700"> {t('Upload.previewUrl')} </span>

              <input
                type="text"
                id="previewUrl"
                disabled
                value={previewUrl}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
          }
          <label
            htmlFor="videoUrl"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('Upload.videoUrl')} </span>

            <input
              type="text"
              id="videoUrl"
              disabled
              value={videoUrl}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <div className="flex items-center space-x-1 w-full">
            <label
              htmlFor="width"
              className="w-full block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            >
              <span className="text-xs font-medium text-gray-700"> {t('Upload.width')} </span>

              <input
                type="number"
                id="width"
                disabled
                value={width}
                placeholder="0"
                onChange={(e) => setWidth(Number(e.target.value))}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
            <label
              htmlFor="height"
              className="w-full block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            >
              <span className="text-xs font-medium text-gray-700"> {t('Upload.height')} </span>

              <input
                type="number"
                id="height"
                disabled
                value={height}
                placeholder="0"
                onChange={(e) => setHeight(Number(e.target.value))}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
          </div>
          <div className="flex items-center space-x-1 w-full">
            <label
              htmlFor="lon"
              className="w-full block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            >
              <span className="text-xs font-medium text-gray-700"> {t('Upload.lon')} </span>

              <input
                type="text"
                id="lon"
                disabled
                value={lon}
                placeholder={t('Upload.inputLon')}
                onChange={(e) => setLon(e.target.value)}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
            <label
              htmlFor="lat"
              className="w-full block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            >
              <span className="text-xs font-medium text-gray-700"> {t('Upload.lat')} </span>

              <input
                type="text"
                id="lat"
                disabled
                value={lat}
                placeholder={t('Upload.inputLat')}
                onChange={(e) => setLat(e.target.value)}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
          </div>
          <label
            htmlFor="detail"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('Upload.detail')} </span>

            <input
              type="text"
              id="detail"
              value={detail}
              placeholder={t('Upload.inputDetail')}
              onChange={(e) => setDetail(e.target.value)}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <TagInput
            tags={!imageLabels ? [] as any : imageLabels.map((label: string) => ({ id: Math.floor(Math.random() * 1000), text: label }))}
            setTags={(newTags: any) => {
              setImageLabels(newTags?.map((label: Tag) => label.text))
            }}
            placeholder={t('Upload.indexTag')}
            styleClasses={{
              inlineTagsContainer:
                'border-input rounded-lg bg-background shadow-sm shadow-black/5 transition-shadow focus-within:border-ring focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/20 p-1 gap-1',
              input: 'w-full min-w-[80px] focus-visible:outline-none shadow-none px-2 h-7',
              tag: {
                body: 'h-7 relative bg-background border border-input hover:bg-background rounded-md font-medium text-xs ps-2 pe-7',
                closeButton:
                  'absolute -inset-y-px -end-px p-0 rounded-e-lg flex size-7 transition-colors outline-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 text-muted-foreground/80 hover:text-foreground',
              },
            }}
            activeTagIndex={activeTagIndex}
            setActiveTagIndex={setActiveTagIndex}
          />
        </div>
      </div>
    </div>
  )
}
