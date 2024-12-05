'use client'

import React, { useState } from 'react'
import type { UploadProps } from 'antd'
import { Upload, ConfigProvider } from 'antd'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { ExifType, AlbumType, ImageType } from '~/types'
import ExifReader from 'exifreader'
import Compressor from 'compressorjs'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import FileUploadHelpSheet from '~/components/admin/upload/FileUploadHelpSheet'
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
import { CircleHelpIcon } from '~/components/icons/circle-help'
import { ImagePlus } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet.tsx'
import { Tag, TagInput } from 'emblor'

export default function FileUpload() {
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
  const [mode, setMode] = useState('singleton')
  const [customUpload, setCustomUpload] = useState(false)
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const { setUploadHelp } = useButtonStore(
    (state) => state,
  )

  const { data, isLoading } = useSWR('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')

  async function loadExif(file: any, outputBuffer: any, flag: boolean) {
    try {
      const tags = await ExifReader.load(file)
      const exifObj = {
        make: '',
        model: '',
        bits: '',
        data_time: '',
        exposure_time: '',
        f_number: '',
        exposure_program: '',
        iso_speed_rating: '',
        focal_length: '',
        lens_specification: '',
        lens_model: '',
        exposure_mode: '',
        cfa_pattern: '',
        color_space: '',
        white_balance: '',
      } as ExifType
      exifObj.make = tags?.Make?.description
      exifObj.model = tags?.Model?.description
      exifObj.bits = tags?.['Bits Per Sample']?.description
      exifObj.data_time = tags?.DateTimeOriginal?.description !== '' ? tags?.DateTimeOriginal?.description : tags?.DateTime?.description;
      exifObj.exposure_time = tags?.ExposureTime?.description
      exifObj.f_number = tags?.FNumber?.description
      exifObj.exposure_program = tags?.ExposureProgram?.description
      exifObj.iso_speed_rating = tags?.ISOSpeedRatings?.description
      exifObj.focal_length = tags?.FocalLength?.description
      exifObj.lens_specification = tags?.LensSpecification?.description
      exifObj.lens_model = tags?.LensModel?.description
      exifObj.exposure_mode = tags?.ExposureMode?.description
      // @ts-ignore
      exifObj.cfa_pattern = tags?.CFAPattern?.description
      exifObj.color_space = tags?.ColorSpace?.description
      exifObj.white_balance = tags?.WhiteBalance?.description
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
      console.log(e)
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
      console.log(e)
    }
  }

  async function customSubmit() {
    try {
      setLoading(true)
      if (!url || url === '') {
        toast.warning('请先填写图片地址！')
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
        labels: imageLabels,
        detail: detail,
        width: width,
        height: height,
        lat: lat,
        type: 1,
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
        toast.success('保存成功！')
      } else {
        toast.error('保存失败！')
      }
    } catch (e) {
      console.log(e)
      toast.error('保存失败！')
    } finally {
      setLoading(false)
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
        type: mode === 'livephoto' ? 2 : 1,
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
        toast.success('保存成功！')
      } else {
        toast.error('保存失败！')
      }
    } catch (e) {
      console.log(e)
      toast.error('保存失败！')
    } finally {
      setLoading(false)
    }
  }

  async function onBeforeUpload(file: any, type: number) {
    if (type === 1) {
      setTitle('')
      setPreviewUrl('')
      setVideoUrl('')
      setImageLabels([])
    }
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
      toast.info('正在获取 AList 挂载目录！')
      const res = await fetch('/api/v1/storage/alist/storages', {
        method: 'GET',
      }).then(res => res.json())
      if (res?.code === 200) {
        setAlistStorage(res.data?.content)
        setStorageSelect(true)
      } else {
        toast.error('AList 挂载目录获取失败！')
      }
    } catch (e) {
      toast.error('AList 挂载目录获取失败！')
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

  async function uploadFile(file: any, type: string) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('storage', storage)
    formData.append('type', type)
    formData.append('mountPath', alistMountPath)
    return await fetch('/api/v1/file/upload', {
      method: 'POST',
      body: formData
    }).then((res) => res.json())
  }

  async function autoSubmit(file: any, url: string, previewUrl: string) {
    try {
      if (mode === 'multiple') {
        if (album === '') {
          toast.warning('请先选择相册！')
          return
        }
        const tags = await ExifReader.load(file)
        const exifObj = {
          make: '',
          model: '',
          bits: '',
          data_time: '',
          exposure_time: '',
          f_number: '',
          exposure_program: '',
          iso_speed_rating: '',
          focal_length: '',
          lens_specification: '',
          lens_model: '',
          exposure_mode: '',
          cfa_pattern: '',
          color_space: '',
          white_balance: '',
        } as ExifType
        exifObj.make = tags?.Make?.description
        exifObj.model = tags?.Model?.description
        exifObj.bits = tags?.['Bits Per Sample']?.description
        exifObj.data_time = tags?.DateTimeOriginal?.description !== '' ? tags?.DateTimeOriginal?.description : tags?.DateTime?.description;
        exifObj.exposure_time = tags?.ExposureTime?.description
        exifObj.f_number = tags?.FNumber?.description
        exifObj.exposure_program = tags?.ExposureProgram?.description
        exifObj.iso_speed_rating = tags?.ISOSpeedRatings?.description
        exifObj.focal_length = tags?.FocalLength?.description
        exifObj.lens_specification = tags?.LensSpecification?.description
        exifObj.lens_model = tags?.LensModel?.description
        exifObj.exposure_mode = tags?.ExposureMode?.description
        // @ts-ignore
        exifObj.cfa_pattern = tags?.CFAPattern?.description
        exifObj.color_space = tags?.ColorSpace?.description
        exifObj.white_balance = tags?.WhiteBalance?.description
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
        try {
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
                lat: '',
                lon: '',
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
                toast.success('保存成功！')
              } else {
                toast.error('保存失败！')
              }
            };
            // @ts-ignore
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        } catch (e) {
          console.log(e)
        }
      }
    } catch (e) {
      console.log(e)
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
          const res = await uploadFile(compressedFile, type)
          if (res?.code === 200) {
            toast.success('预览图片上传成功！')
            option.onSuccess(option.file)
            setPreviewUrl(res?.data)
            await autoSubmit(flag ? outputBuffer : option.file, url, res?.data)
          } else {
            toast.error('预览图片上传失败！')
          }
        } else {
          const compressedFileFromBlob = new File([compressedFile], flag ? outputBuffer.name : option.file.name, {
            type: compressedFile.type,
          });
          const res = await uploadFile(compressedFileFromBlob, type)
          if (res?.code === 200) {
            toast.success('预览图片上传成功！')
            option.onSuccess(option.file)
            setPreviewUrl(res?.data)
            await autoSubmit(flag ? outputBuffer : option.file, url, res?.data)
          } else {
            toast.error('预览图片上传失败！')
          }
        }
      },
      error(err) {
        console.log(err.message);
        toast.error('预览图片上传失败！')
      },
    })
  }

  async function resHandle(res: any, option: any, type: number, flag: boolean, outputBuffer: any) {
    if (mode === 'livephoto' && type === 2) {
      if (res?.code === 200) {
        toast.success('LivePhoto 视频上传成功！')
        setVideoUrl(res?.data)
        option.onSuccess(option.file)
      } else {
        option.onError(option.file)
        toast.error('LivePhoto 视频上传失败！')
      }
    } else {
      if (res?.code === 200) {
        toast.success('图片上传成功，尝试生成预览图片并上传！')
        try {
          if (album === '/') {
            await uploadPreviewImage(option, '/preview', res?.data, flag, outputBuffer)
          } else {
            await uploadPreviewImage(option, album + '/preview', res?.data, flag, outputBuffer)
          }
        } catch (e) {
          console.log(e)
          option.onSuccess(option.file)
        }
        await loadExif(option.file, outputBuffer, flag)
        setUrl(res?.data)
      } else {
        option.onError(option.file)
        toast.error('图片上传失败！')
      }
    }
  }

  async function onRequestUpload(option: any, type: number) {
    let outputBuffer: Blob | Blob[];
    const ext = option.file.name.split(".").pop()?.toLowerCase();
    // 获取文件名但是去掉扩展名部分
    const fileName = option.file.name.split(".").slice(0, -1).join(".");
    const flag = ext === 'heic' || ext === 'heif'
    if (flag && type === 1) {
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
            await uploadFile(compressedFile, album).then(async (res) => {
              await resHandle(res, option, type, flag, outputBuffer)
            })
          } else {
            const compressedFileFromBlob = new File([compressedFile], fileName + '.jpg', {
              type: compressedFile.type,
            });
            await uploadFile(compressedFileFromBlob, album).then(async (res) => {
              await resHandle(res, option, type, flag, outputBuffer)
            })
          }
        }
      })
    } else {
      await uploadFile(option.file, album).then(async (res) => {
        await resHandle(res, option, type, flag, outputBuffer)
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
    multiple: mode === 'multiple',
    maxCount: mode === 'multiple' ? 5 : 1,
    customRequest: (file) => onRequestUpload(file, 1),
    beforeUpload: async (file) => await onBeforeUpload(file, 1),
    onRemove: async () => {
      if (mode === 'singleton' || mode === 'livephoto') {
        await onRemoveFile()
      }
    }
  }

  const videoProps: UploadProps = {
    listType: "picture",
    name: 'file',
    maxCount: 1,
    customRequest: (file) => onRequestUpload(file, 2),
    beforeUpload: async (file) => await onBeforeUpload(file, 2),
    onRemove: async () => {
      if (mode === 'singleton' || mode === 'livephoto') {
        await onRemoveFile()
      }
    }
  }

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <div className="flex justify-between space-x-1">
        <div className="flex items-center justify-center w-full sm:w-64 md:w-80">
          <Select
            value={mode}
            onValueChange={(value: string) => {
              setMode(value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择上传方式，默认单文件上传"/>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem key="singleton" value="singleton">
                  单文件上传
                </SelectItem>
                <SelectItem key="livephoto" value="livephoto">
                  LivePhoto 上传
                </SelectItem>
                <SelectItem key="multiple" value="multiple">
                  多文件上传
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="新增"
            onClick={() => setCustomUpload(true)}
          >
            <ImagePlus />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="帮助"
            onClick={() => setUploadHelp(true)}
          >
            <CircleHelpIcon />
          </Button>
          {mode !== 'multiple'
            ? <Button
              variant="outline"
              disabled={loading}
              onClick={() => submit()}
              aria-label="提交"
            >
              {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              提交
            </Button>
            :
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => onRemoveFile()}
              aria-label="重置"
            >
              {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              重置
            </Button>
          }
        </div>
      </div>
      <div className="flex flex-col show-up-motion space-y-2">
        <div className="flex justify-between space-x-2">
          <div className="flex w-full justify-between space-x-1">
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
                <SelectValue placeholder="请选择存储" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>相册</SelectLabel>
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
                <SelectValue placeholder="请选择相册" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>相册</SelectLabel>
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
                  <SelectValue placeholder="请选择Alist目录" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Alist目录</SelectLabel>
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
              <p className="ant-upload-text">点击上传文件或拖拽文件到这里</p>
              <p className="ant-upload-hint">
                Vercel 等平台 Free 订阅限制上传大小 6M。
              </p>
            </Dragger>
          </ConfigProvider>
        </div>
        <div>
          {
            url && url !== '' && mode !== 'multiple' && !customUpload &&
            <>
              {
                mode === 'livephoto' &&
                <ConfigProvider
                  theme={{
                    "token": {
                      "colorTextBase": "#13c2c2"
                    }
                  }}
                >
                  <Dragger {...videoProps}>
                    <p className="ant-upload-text">上传 LivePhoto 视频</p>
                    <p className="ant-upload-hint">
                      Vercel 等平台 Free 订阅限制上传大小 6M。
                    </p>
                  </Dragger>
                </ConfigProvider>
              }
              <div className="w-full mt-2 space-y-2">
                <label
                  htmlFor="title"
                  className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                >
                  <span className="text-xs font-medium text-gray-700"> 图片标题 </span>

                  <input
                    type="text"
                    id="title"
                    value={title}
                    placeholder="输入图片标题"
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                  />
                </label>
                <label
                  htmlFor="url"
                  className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                >
                  <span className="text-xs font-medium text-gray-700"> 图片地址 </span>

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
                    <span className="text-xs font-medium text-gray-700"> 预览图片地址 </span>

                    <input
                      type="text"
                      id="previewUrl"
                      disabled
                      value={previewUrl}
                      className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                    />
                  </label>
                }
                {mode === 'livephoto' && videoUrl && videoUrl !== '' &&
                  <label
                    htmlFor="videoUrl"
                    className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                  >
                    <span className="text-xs font-medium text-gray-700"> LivePhoto 视频地址 </span>

                    <input
                      type="text"
                      id="videoUrl"
                      disabled
                      value={videoUrl}
                      className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                    />
                  </label>
                }
                <div className="flex items-center space-x-1 w-full">
                  <label
                    htmlFor="width"
                    className="w-full block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                  >
                    <span className="text-xs font-medium text-gray-700"> 图片宽度 px </span>

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
                    <span className="text-xs font-medium text-gray-700"> 图片高度 px </span>

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
                    <span className="text-xs font-medium text-gray-700"> 经度 </span>

                    <input
                      type="text"
                      id="lon"
                      value={lon}
                      placeholder="输入经度"
                      onChange={(e) => setLon(e.target.value)}
                      className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                    />
                  </label>
                  <label
                    htmlFor="lat"
                    className="w-full block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                  >
                    <span className="text-xs font-medium text-gray-700"> 纬度 </span>

                    <input
                      type="text"
                      id="lat"
                      value={lat}
                      placeholder="输入经度"
                      onChange={(e) => setLat(e.target.value)}
                      className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                    />
                  </label>
                </div>
                <label
                  htmlFor="detail"
                  className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
                >
                  <span className="text-xs font-medium text-gray-700"> 描述 </span>

                  <input
                    type="text"
                    id="detail"
                    value={detail}
                    placeholder="请输入描述"
                    onChange={(e) => setDetail(e.target.value)}
                    className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                  />
                </label>
                <TagInput
                  tags={!imageLabels ? [] as any : imageLabels.map((label: string) => ({ id: Math.floor(Math.random() * 1000), text: label }))}
                  setTags={(newTags: any) => {
                    setImageLabels(newTags?.map((label: Tag) => label.text))
                  }}
                  placeholder="请输入图片索引标签，如：猫猫，不要输入特殊字符。"
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
      <FileUploadHelpSheet/>
      <Sheet
        defaultOpen={false}
        open={customUpload}
        onOpenChange={async (open: boolean) => {
          if (!open) {
            setCustomUpload(false)
            await onRemoveFile()
          }
        }}
        modal={false}
      >
        <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide space-y-2"
                      onInteractOutside={(event: any) => event.preventDefault()}>
          <SheetHeader>
            <SheetTitle>手动上传</SheetTitle>
            <SheetDescription className="space-y-2">
              <p>
                虽然不太推荐，但还是提供了这么个方式。
              </p>
            </SheetDescription>
          </SheetHeader>
          <div className="flex justify-between space-x-2">
            <div className="flex w-full justify-between space-x-1">
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
                  <SelectValue placeholder="请选择存储"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>相册</SelectLabel>
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
                  <SelectValue placeholder="请选择相册"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>相册</SelectLabel>
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
                    <SelectValue placeholder="请选择Alist目录"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Alist目录</SelectLabel>
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
          <div className="w-full mt-2 space-y-2">
            <label
              htmlFor="title"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <span className="text-xs font-medium text-gray-700"> 图片标题 </span>

              <input
                type="text"
                id="title"
                value={title}
                placeholder="输入图片标题"
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
            <label
              htmlFor="url"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <span className="text-xs font-medium text-gray-700"> 图片地址 </span>

              <input
                type="text"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
            <div className="flex items-center space-x-1 w-full">
              <label
                htmlFor="width"
                className="w-full block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
              >
                <span className="text-xs font-medium text-gray-700"> 图片宽度 px </span>

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
                <span className="text-xs font-medium text-gray-700"> 图片高度 px </span>

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
                <span className="text-xs font-medium text-gray-700"> 经度 </span>

                <input
                  type="text"
                  id="lon"
                  value={lon}
                  placeholder="输入经度"
                  onChange={(e) => setLon(e.target.value)}
                  className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                />
              </label>
              <label
                htmlFor="lat"
                className="w-full block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
              >
                <span className="text-xs font-medium text-gray-700"> 纬度 </span>

                <input
                  type="text"
                  id="lat"
                  value={lat}
                  placeholder="输入经度"
                  onChange={(e) => setLat(e.target.value)}
                  className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                />
              </label>
            </div>
            <label
              htmlFor="detail"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <span className="text-xs font-medium text-gray-700"> 描述 </span>

              <input
                type="text"
                id="detail"
                value={detail}
                placeholder="请输入描述"
                onChange={(e) => setDetail(e.target.value)}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
            <TagInput
              tags={!imageLabels ? [] as any : imageLabels.map((label: string) => ({ id: Math.floor(Math.random() * 1000), text: label }))}
              setTags={(newTags: any) => {
                setImageLabels(newTags?.map((label: Tag) => label.text))
              }}
              placeholder="请输入图片索引标签，如：猫猫，不要输入特殊字符。"
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
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => customSubmit()}
            aria-label="提交"
          >
            {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
            提交
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  )
}
