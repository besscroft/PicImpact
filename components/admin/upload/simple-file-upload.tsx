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
import { exifReader } from '~/lib/utils/file'
import { RocketIcon } from '~/components/icons/rocket'
import { RefreshCWIcon } from '~/components/icons/refresh-cw'
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
} from '~/components/ui/file-upload'
import { Button } from '~/components/ui/button'
import { X } from 'lucide-react'
import { UploadIcon } from '~/components/icons/upload'
import { encodeBrowserThumbHash } from '~/lib/utils/blurhash-client.ts'
import { useUploadConfig, STORAGE_OPTIONS } from '~/hooks/use-upload-config'

export default function SimpleFileUpload() {
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
  const [imageId, setImageId] = useState('')
  const [imageName, setImageName] = useState('')
  const [url, setUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [detail, setDetail] = useState('')
  const [hash, setHash] = useState('')
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
        // @ts-expect-error
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async () => {
    if (!url || url === '') {
      toast.warning(t('Tips.uploadFileFirst'))
      return
    }
    if (album === '') {
      toast.warning(t('Tips.selectAlbumFirst'))
      return
    }
    if (!height || height <= 0) {
      toast.warning(t('Tips.imageHeightRequired'))
      return
    }
    if (!width || width <= 0) {
      toast.warning(t('Tips.imageWidthRequired'))
      return
    }
    const data = {
      id: imageId,
      album: album,
      url: url,
      image_name: imageName,
      title: title,
      preview_url: previewUrl,
      video_url: videoUrl,
      blurhash: hash,
      exif: exif,
      labels: imageLabels,
      detail: detail,
      width: width,
      height: height,
      type: 1,
      lat: lat,
      lon: lon,
    } as ImageType
    try {
      const res = await fetch('/api/v1/images', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'post',
        // @ts-expect-error
        body: JSON.stringify(data),
      }).then(res => res.json())
      if (res?.code === 200) {
        toast.success(t('Tips.saveSuccess'))
      } else {
        toast.error(t('Tips.saveFailed'))
      }
    } catch (e) {
      toast.error(t('Tips.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function onRequestUpload(file: File) {
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
    setImageId(res?.data?.imageId)
    setImageName(res?.data?.fileName)
  }

  function onRemoveFile() {
    resetStorageState()
    setExif({} as ExifType)
    setUrl('')
    setHash('')
    setTitle('')
    setImageId('')
    setImageName('')
    setDetail('')
    setWidth(0)
    setHeight(0)
    setLat('')
    setLon('')
    setPreviewUrl('')
    setVideoUrl('')
    setImageLabels([])
  }

  async function onBeforeUpload() {
    setTitle('')
    setImageId('')
    setImageName('')
    setPreviewUrl('')
    setVideoUrl('')
    setImageLabels([])
  }

  const [files, setFiles] = React.useState<File[]>([])

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
            await onBeforeUpload()
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
      <div className="flex space-x-2">
        <div className="flex flex-1 w-full space-x-1">
          <Select
            defaultValue={storage}
            onValueChange={handleStorageChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('Upload.selectStorage')}/>
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
            onValueChange={async (value: string) => {
              setAlbum(value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('Upload.selectAlbum')}/>
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
            onClick={() => handleSubmit()}
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
            <SelectValue placeholder={t('Upload.selectOpenListDirectory')}/>
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
        <FileUpload
          maxFiles={1}
          className="w-full h-full"
          value={files}
          onValueChange={setFiles}
          onUpload={onUpload}
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
            {files.map((file, index) => (
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
            tags={!imageLabels ? [] as any : imageLabels.map((label: string) => ({
              id: Math.floor(Math.random() * 1000),
              text: label
            }))}
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
