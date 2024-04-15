'use client'

import React from 'react'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Upload } from 'antd'
import { toast } from 'sonner'

export default function FileUpload() {

  const { Dragger } = Upload;

  async function onRequestUpload(option: any) {
    const formData = new FormData()

    formData.append('file', option.file)
    formData.append('storage', 'alist')
    formData.append('type', 'test')
    formData.append('mountPath', '/')
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
    }
  }

  return (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text dark:!text-white">点击上传文件或拖拽文件到这里</p>
      <p className="ant-upload-hint dark:!text-gray-200">
        Vercel 等平台 Free 订阅限制上传大小 6M。
      </p>
    </Dragger>
  )
}