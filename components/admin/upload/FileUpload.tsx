'use client'

import React, {useState} from 'react'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Upload } from 'antd'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '~/utils/fetcher'
import { TagType } from '~/types'
import { Button, Select, SelectItem } from '@nextui-org/react'
import { CardHeader } from '@nextui-org/card'


export default function FileUpload() {
  const [alistStorage, setAlistStorage] = useState([])
  const [storageSelect, setStorageSelect] = useState(false)
  const [storage, setStorage] = useState(new Set([] as string[]))
  const [tag, setTag] = useState(new Set([] as string[]))
  const [alistMountPath, setAlistMountPath] = useState(new Set([] as string[]))

  const { data, error, isLoading } = useSWR('/api/v1/get-tags', fetcher)

  async function onBeforeUpload(file: any) {
    const storageArray = Array.from(storage)
    const tagArray = Array.from(tag)
    const alistMountPathArray = Array.from(alistMountPath)
    if (storageArray.length === 0 || storageArray[0] === '') {
      toast.warning('请先选择存储！')
      file.abort()
    } else if (storageArray[0] === 'alist' && (alistMountPathArray.length === 0 || alistMountPathArray[0] === '')) {
      toast.warning('请先选择挂载目录！')
      file.abort()
    } else if (tagArray.length === 0 || tagArray[0] === '') {
      toast.warning('请先选择标签！')
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
      const res = await fetch('/api/v1/alist-storages', {
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
      label: 'S3',
      value: 's3',
    },
    {
      label: 'AList',
      value: 'alist',
    }
  ]

  const { Dragger } = Upload;

  async function onRequestUpload(option: any) {
    const storageArray = Array.from(storage)
    const tagArray = Array.from(tag)
    const alistMountPathArray = Array.from(alistMountPath)

    const formData = new FormData()

    formData.append('file', option.file)
    formData.append('storage', storageArray[0])
    formData.append('type', tagArray[0])
    formData.append('mountPath', alistMountPathArray[0])
    const data = await fetch('/api/v1/file-upload', {
      method: 'POST',
      body: formData
    }).then((res) => res.json())
    console.log(data)
    if (data?.code === 200) {
      option.onSuccess(option.file)
      toast.success('文件上传成功！')
    } else {
      option.onError(option.file)
      toast.error('文件上传失败！')
    }
  }

  const props: UploadProps = {
    listType: "picture",
    name: 'file',
    multiple: false,
    maxCount: 1,
    customRequest: (file) => onRequestUpload(file),
    onChange: (event) => {
      console.log(event)
    },
    beforeUpload: async (file) => await onBeforeUpload(file),
    onRemove: (file) => {
      setStorageSelect(false)
      setStorage(new Set([] as string[]))
      setTag(new Set([] as string[]))
      setAlistMountPath(new Set([] as string[]))
    }
  }

  return (
    <>
      <CardHeader className="flex flex-col space-y-1 p-0 pb-1">
        <div className="flex w-full justify-between space-x-1">
          <Select
            isRequired
            variant="bordered"
            label="存储"
            placeholder="请选择存储"
            selectedKeys={storage}
            onSelectionChange={(keys) => {
              const updatedSet = new Set([] as string[]);
              updatedSet.add(keys?.currentKey);
              setStorage(updatedSet)
              if (keys?.currentKey === 'alist') {
                getAlistStorage()
              } else {
                setStorageSelect(false)
              }
            }}
          >
            {storages.map((storage) => (
              <SelectItem key={storage.value} value={storage.value}>
                {storage.label}
              </SelectItem>
            ))}
          </Select>
          <Select
            isRequired
            variant="bordered"
            label="标签"
            placeholder="请选择标签"
            isLoading={isLoading}
            selectedKeys={tag}
            onSelectionChange={(keys) => {
              const updatedSet = new Set([] as string[]);
              updatedSet.add(keys?.currentKey);
              setTag(updatedSet)
            }}
          >
            {data?.map((tag: TagType) => (
              <SelectItem key={tag.tag_value} value={tag.tag_value}>
                {tag.name}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="w-full">
          {
            storageSelect && alistStorage?.length > 0
              ?
              <Select
                isRequired
                variant="bordered"
                label="目录"
                placeholder="请选择Alist目录"
                selectedKeys={alistMountPath}
                onSelectionChange={(keys) => {
                  const updatedSet = new Set([] as string[]);
                  updatedSet.add(keys?.currentKey);
                  setAlistMountPath(updatedSet)
                }}
              >
                {alistStorage?.map((storage) => (
                  <SelectItem key={storage?.mount_path} value={storage?.mount_path}>
                    {storage?.mount_path}
                  </SelectItem>
                ))}
              </Select>
              :
              <></>
          }
        </div>
      </CardHeader>
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text dark:!text-white">点击上传文件或拖拽文件到这里</p>
        <p className="ant-upload-hint dark:!text-gray-200">
          Vercel 等平台 Free 订阅限制上传大小 6M。
        </p>
      </Dragger>
    </>
  )
}