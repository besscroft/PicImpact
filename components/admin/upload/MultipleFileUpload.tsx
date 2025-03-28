'use client'

import React, { useState } from 'react'
import type { UploadProps } from 'antd'
import { Upload, ConfigProvider } from 'antd'
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

export default function MultipleFileUpload() {
  const [alistStorage, setAlistStorage] = useState([])
  const [storageSelect, setStorageSelect] = useState(false)
  const [storage, setStorage] = useState('r2')
  const [album, setAlbum] = useState('')
  const [alistMountPath, setAlistMountPath] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const t = useTranslations()

  const { data, isLoading } = useSWR('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')

  async function onBeforeUpload(file: any) {
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
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          const data = {
            album: album,
            url: url,
            title: '',
            preview_url: previewUrl,
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
        };
        // @ts-ignore
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e)
      toast.error('保存失败')
    }
  }

  async function uploadPreviewImage(option: any, type: string, url: string, flag: boolean, outputBuffer: any) {
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
            await autoSubmit(flag ? outputBuffer : option.file, url, res?.data)
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
            await autoSubmit(flag ? outputBuffer : option.file, url, res?.data)
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
        await uploadPreviewImage(option, '/preview', res?.data, flag, outputBuffer)
      } else {
        await uploadPreviewImage(option, album + '/preview', res?.data, flag, outputBuffer)
      }
    } catch (e) {
      console.error(e)
      option.onSuccess(option.file)
    }
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
    setLat('')
    setLon('')
  }

  const props: UploadProps = {
    listType: "picture",
    name: 'file',
    multiple: true,
    maxCount: 5,
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
      </div>
    </div>
  )
}
