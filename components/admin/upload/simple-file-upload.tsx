'use client'

import React, { useState } from 'react'
import type { UploadProps } from 'antd'
import { Upload, ConfigProvider } from 'antd'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { ExifType, AlbumType, ImageType } from '~/types'
import Compressor from 'compressorjs'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
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
import { Send } from 'lucide-react'

export default function SimpleFileUpload() {
  const [alistStorage, setAlistStorage] = useState([])
  const [storageSelect, setStorageSelect] = useState(false)
  const [storage, setStorage] = useState('r2')
  const [album, setAlbum] = useState('')
  const [alistMountPath, setAlistMountPath] = useState('')
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
  const [detail, setDetail] = useState('')
  const [imageLabels, setImageLabels] = useState([] as string[])
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const t = useTranslations()

  const { data, isLoading } = useSWR('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')

  async function loadExif(file: any, outputBuffer: any, flag: boolean) {
    try {
      const { tags, exifObj } = await exifReader(file)
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
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setWidth(Number(img.width))
          setHeight(Number(img.height))
        };
        // @ts-ignore
        img.src = e.target.result;
      };
      if (flag) {
        reader.readAsDataURL(outputBuffer);
      } else {
        reader.readAsDataURL(file);
      }
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
        video_url: videoUrl,
        exif: exif,
        labels: imageLabels,
        detail: detail,
        width: width,
        height: height,
        type: 1,
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
    } catch (e) {
      toast.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  async function onBeforeUpload(file: any) {
    setTitle('')
    setPreviewUrl('')
    setVideoUrl('')
    setImageLabels([])
    if (storage === '') {
      toast.warning('请先选择存储！')
      file.abort()
    } else if (storage === 'alist' && alistMountPath === '') {
      toast.warning('请先选择挂载目录！')
      file.abort()
    } else if (album === '') {
      toast.warning('请先选择相册！')
      file.abort()
    } else {
      toast.info('正在上传文件！')
    }
  }

  async function getAlistStorage() {
    if (alistStorage.length > 0) {
      setStorageSelect(true)
      return
    }
    try {
      toast.info('正在获取 AList 挂载目录')
      const res = await fetch('/api/v1/storage/alist/storages', {
        method: 'GET',
      }).then(res => res.json())
      if (res?.code === 200) {
        setAlistStorage(res.data?.content)
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
      label: 'AList API',
      value: 'alist',
    }
  ]

  const { Dragger } = Upload;

  async function uploadPreviewImage(option: any, type: string, flag: boolean, outputBuffer: any) {
    new Compressor(flag ? outputBuffer : option.file, {
      quality: previewCompressQuality,
      checkOrientation: false,
      mimeType: 'image/webp',
      maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
      async success(compressedFile) {
        if (compressedFile instanceof File) {
          const res = await uploadFile(compressedFile, type, storage, alistMountPath)
          if (res?.code === 200) {
            toast.success('预览图片上传成功')
            option.onSuccess(option.file)
            setPreviewUrl(res?.data)
          } else {
            toast.error('预览图片上传失败')
          }
        } else {
          const compressedFileFromBlob = new File([compressedFile], flag ? outputBuffer.name : option.file.name, {
            type: compressedFile.type,
          });
          const res = await uploadFile(compressedFileFromBlob, type, storage, alistMountPath)
          if (res?.code === 200) {
            toast.success('预览图片上传成功')
            option.onSuccess(option.file)
            setPreviewUrl(res?.data)
          } else {
            toast.error('预览图片上传失败')
          }
        }
      },
      error() {
        toast.error('预览图片上传失败')
      },
    })
  }

  async function resHandle(res: any, option: any, flag: boolean, outputBuffer: any) {
    try {
      if (album === '/') {
        await uploadPreviewImage(option, '/preview', flag, outputBuffer)
      } else {
        await uploadPreviewImage(option, album + '/preview', flag, outputBuffer)
      }
    } catch (e) {
      option.onSuccess(option.file)
    }
    await loadExif(option.file, outputBuffer, flag)
    setUrl(res?.data)
  }

  async function onRequestUpload(option: any) {
    let outputBuffer: Blob | Blob[];
    const ext = option.file.name.split(".").pop()?.toLowerCase();
    // 获取文件名但是去掉扩展名部分
    const fileName = option.file.name.split(".").slice(0, -1).join(".");
    const flag = ext === 'heic' || ext === 'heif'
    if (flag) {
      // 把 HEIC 转成 JPEG
      const heic2any = await import('heic2any')
      outputBuffer = await heic2any.default({ blob: option.file, toType: 'image/jpeg' });
      // 添加文件名
      // @ts-ignore
      outputBuffer.name = fileName + '.jpg'
      // @ts-ignore
      new Compressor(outputBuffer, {
        quality: previewCompressQuality,
        checkOrientation: false,
        mimeType: 'image/jpeg',
        maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
        async success(compressedFile) {
          if (compressedFile instanceof File) {
            await uploadFile(compressedFile, album, storage, alistMountPath).then(async (res) => {
              if (res.code === 200) {
                toast.success('图片上传成功，尝试生成预览图片并上传！')
                await resHandle(res, option, flag, outputBuffer)
              } else {
                option.onError(option.file)
                toast.error('图片上传失败')
              }
            })
          } else {
            const compressedFileFromBlob = new File([compressedFile], fileName + '.jpg', {
              type: compressedFile.type,
            });
            await uploadFile(compressedFileFromBlob, album, storage, alistMountPath).then(async (res) => {
              if (res.code === 200) {
                toast.success('图片上传成功，尝试生成预览图片并上传！')
                await resHandle(res, option, flag, outputBuffer)
              } else {
                option.onError(option.file)
                toast.error('图片上传失败')
              }
            })
          }
        }
      })
    } else {
      await uploadFile(option.file, album, storage, alistMountPath).then(async (res) => {
        if (res.code === 200) {
          toast.success('图片上传成功，尝试生成预览图片并上传！')
          await resHandle(res, option, flag, outputBuffer)
        } else {
          option.onError(option.file)
          toast.error('图片上传失败')
        }
      })
    }
  }

  async function onRemoveFile() {
    setStorageSelect(false)
    setAlistMountPath('')
    setExif({} as ExifType)
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

  const props: UploadProps = {
    listType: "picture",
    name: 'file',
    maxCount: 1,
    customRequest: (file) => onRequestUpload(file),
    beforeUpload: async (file) => await onBeforeUpload(file),
    onRemove: async () => {
      await onRemoveFile()
    }
  }

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <div className="flex flex-1 w-full space-x-1">
            <Select
              defaultValue={storage}
              onValueChange={async (value: string) => {
                setStorage(value)
                if (value === 'alist') {
                  getAlistStorage()
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
              onValueChange={async (value: string) => {
                setAlbum(value)
              }}
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
          </div>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => submit()}
            aria-label={t('Button.submit')}
          >
            {loading ? <ReloadIcon className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
          {
            storageSelect && alistStorage?.length > 0 &&
            <div className="w-full">
              <Select
                disabled={isLoading}
                defaultValue={album}
                onValueChange={async (value: string) => {
                  setAlistMountPath(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Upload.selectAlistDirectory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{t('Upload.alistDirectory')}</SelectLabel>
                    {alistStorage?.map((storage: any) => (
                      <SelectItem key={storage?.mount_path} value={storage?.mount_path}>
                        {storage?.mount_path}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          }
        </div>
        <div>
          <ConfigProvider
            theme={{
              "token": {
                "colorTextBase": "#13c2c2"
              }
            }}
          >
            <Dragger {...props}>
              <p className="ant-upload-text">{t('Upload.uploadTips1')}</p>
              <p className="ant-upload-hint">
                {t('Upload.uploadTips2')}
              </p>
            </Dragger>
          </ConfigProvider>
        </div>
        <div>
          {
            url && url !== '' &&
            <>
              <div className="w-full mt-2 space-y-2">
                <label
                  htmlFor="title"
                  className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
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
                  className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
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
                    className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
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
                <div className="flex items-center space-x-1 w-full">
                  <label
                    htmlFor="width"
                    className="w-full block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                  >
                    <span className="text-xs font-medium text-gray-700"> {t('Upload.width')} </span>

                    <input
                      type="number"
                      id="width"
                      value={width}
                      placeholder="0"
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                    />
                  </label>
                  <label
                    htmlFor="height"
                    className="w-full block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                  >
                    <span className="text-xs font-medium text-gray-700"> {t('Upload.height')} </span>

                    <input
                      type="number"
                      id="height"
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
                    className="w-full block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                  >
                    <span className="text-xs font-medium text-gray-700"> {t('Upload.lon')} </span>

                    <input
                      type="text"
                      id="lon"
                      value={lon}
                      placeholder={t('Upload.inputLon')}
                      onChange={(e) => setLon(e.target.value)}
                      className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                    />
                  </label>
                  <label
                    htmlFor="lat"
                    className="w-full block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                  >
                    <span className="text-xs font-medium text-gray-700"> {t('Upload.lat')} </span>

                    <input
                      type="text"
                      id="lat"
                      value={lat}
                      placeholder={t('Upload.inputLat')}
                      onChange={(e) => setLat(e.target.value)}
                      className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                    />
                  </label>
                </div>
                <label
                  htmlFor="detail"
                  className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
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
                      "border-input rounded-lg bg-background shadow-sm shadow-black/5 transition-shadow focus-within:border-ring focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/20 p-1 gap-1",
                    input: "w-full min-w-[80px] focus-visible:outline-none shadow-none px-2 h-7",
                    tag: {
                      body: "h-7 relative bg-background border border-input hover:bg-background rounded-md font-medium text-xs ps-2 pe-7",
                      closeButton:
                        "absolute -inset-y-px -end-px p-0 rounded-e-lg flex size-7 transition-colors outline-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 text-muted-foreground/80 hover:text-foreground",
                    },
                  }}
                  activeTagIndex={activeTagIndex}
                  setActiveTagIndex={setActiveTagIndex}
                />
              </div>
            </>
          }
        </div>
      </div>
    </div>
  )
}
