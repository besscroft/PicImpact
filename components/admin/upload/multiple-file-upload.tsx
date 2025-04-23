'use client'

import React, { useState, useEffect } from 'react'
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
import { Input } from '~/components/ui/input'

export default function MultipleFileUpload() {
  const [alistStorage, setAlistStorage] = useState([])
  const [storageSelect, setStorageSelect] = useState(false)
  const [storage, setStorage] = useState('r2')
  const [album, setAlbum] = useState('')
  const [alistMountPath, setAlistMountPath] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [maxFiles, setMaxFiles] = useState(5)
  const [files, setFiles] = useState<File[]>([])
  const t = useTranslations()

  const { data, isLoading } = useSWR('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')
  const maxUploadFiles = parseInt(configs?.find(config => config.config_key === 'max_upload_files')?.config_value || '5')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 客户端代码
    }
  }, [])

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
      throw new Error("Upload failed")
    }
  }

  async function uploadPreviewImage(file: File, type: string, url: string, flag: boolean, outputBuffer: any) {
    new Compressor(flag ? outputBuffer : file, {
      quality: previewCompressQuality,
      checkOrientation: false,
      mimeType: 'image/webp',
      maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
      async success(compressedFile) {
        if (compressedFile instanceof File) {
          const res = await uploadFile(compressedFile, type, storage, alistMountPath)
          if (res?.code === 200) {
            await autoSubmit(flag ? outputBuffer : file, url, res?.data)
          } else {
            throw new Error("Upload failed")
          }
        } else {
          const compressedFileFromBlob = new File([compressedFile], flag ? outputBuffer.name : file.name, {
            type: compressedFile.type,
          });
          const res = await uploadFile(compressedFileFromBlob, type, storage, alistMountPath)
          if (res?.code === 200) {
            await autoSubmit(flag ? outputBuffer : file, url, res?.data)
          } else {
            throw new Error("Upload failed")
          }
        }
      },
      error() {
        throw new Error("Upload failed")
      },
    })
  }

  async function resHandle(res: any, file: File, flag: boolean, outputBuffer: any) {
    try {
      if (album === '/') {
        await uploadPreviewImage(file, '/preview', res?.data, flag, outputBuffer)
      } else {
        await uploadPreviewImage(file, album + '/preview', res?.data, flag, outputBuffer)
      }
    } catch (e) {
      throw new Error("Upload failed")
    }
  }

  async function onRequestUpload(file: File) {
    let outputBuffer: Blob | Blob[];
    const ext = file.name.split(".").pop()?.toLowerCase();
    // 获取文件名但是去掉扩展名部分
    const fileName = file.name.split(".").slice(0, -1).join(".");
    const flag = ext === 'heic' || ext === 'heif'
    if (flag) {
      // 把 HEIC 转成 JPEG
      const heic2any = await import('heic2any')
      outputBuffer = await heic2any.default({ blob: file, toType: 'image/jpeg' });
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
                await resHandle(res, file, flag, outputBuffer)
              } else {
                throw new Error("Upload failed")
              }
            })
          } else {
            const compressedFileFromBlob = new File([compressedFile], fileName + '.jpg', {
              type: compressedFile.type,
            });
            await uploadFile(compressedFileFromBlob, album, storage, alistMountPath).then(async (res) => {
              if (res.code === 200) {
                await resHandle(res, file, flag, outputBuffer)
              } else {
                throw new Error("Upload failed")
              }
            })
          }
        }
      })
    } else {
      await uploadFile(file, album, storage, alistMountPath).then(async (res) => {
        if (res.code === 200) {
          await resHandle(res, file, flag, outputBuffer)
        } else {
          throw new Error("Upload failed")
        }
      })
    }
  }

  function onRemoveFile() {
    setStorageSelect(false)
    setAlistMountPath('')
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
            onSuccess(file);
          } catch (error) {
            onError(
              file,
              error instanceof Error ? error : new Error("Upload failed"),
            );
          }
        });

        toast.promise(() => Promise.all(uploadPromises), {
          loading: t('Upload.uploading'),
          success: () => {
            return t('Upload.uploadSuccess');
          },
          error: t('Upload.uploadError'),
        });
      } catch (error) {
        // This handles any error that might occur outside the individual upload processes
        console.error("Unexpected error during upload:", error);
        toast.error('Upload failed')
      }
    },
    [onRequestUpload],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Select
          disabled={isLoading}
          value={storage}
          onValueChange={async (value: string) => {
            setStorage(value)
            if (value === 'alist') {
              await getAlistStorage()
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
              {storages.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          disabled={isLoading}
          value={album}
          onValueChange={setAlbum}
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
      <FileUpload
        value={files}
        onValueChange={setFiles}
        onUpload={onUpload}
        maxFiles={maxUploadFiles}
        multiple={true}
        disabled={storage === '' || album === '' || (storage === 'alist' && alistMountPath === '')}
      >
        <FileUploadDropzone>
          <div className="flex flex-col items-center justify-center gap-2">
            <UploadIcon className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              拖拽文件到此处或点击上传
            </div>
          </div>
        </FileUploadDropzone>
        <FileUploadList>
          {files.map((file, index) => (
            <FileUploadItem key={index} value={file}>
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
              <FileUploadItemDelete />
            </FileUploadItem>
          ))}
        </FileUploadList>
      </FileUpload>
    </div>
  )
}

