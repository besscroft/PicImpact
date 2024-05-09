'use client'

import { Card, CardBody } from '@nextui-org/react'
import React, { useState } from 'react'
import { CloudUploadOutlined, CloudDownloadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Button, Upload } from 'antd'
import { toast } from 'sonner'
import dayjs from 'dayjs'

export default function Backup() {
  const [restorePicImpactLoading, setRestorePicImpactLoading] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)

  async function backup() {
    try {
      setBackupLoading(true)
      const res = await fetch('/api/v1/get-images-json', {
        method: 'GET',
      }).then(res => res.json())
      if (res && res.length > 0) {
        toast.success('备份数据获取成功！')
        const blob = new Blob([JSON.stringify(res)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const formatted = dayjs().format('YYYY-MM-DD-HH-mm-ss')
        a.download = `picimpact-backup-${formatted}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        toast.error('备份数据获取失败！')
      }
    } catch (e) {
      toast.error('备份数据获取失败！')
    } finally {
      setBackupLoading(false)
    }
  }

  async function restore(data: any[]) {
    try {
      const res = await fetch('/api/v1/restore-images-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(res => res.json())
      if (res?.code === 200) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (e) {
      toast.error('还原失败！')
    }
  }

  async function readPicImpactJSONFile(file: File) {
    try {
      let reader = new FileReader();
      reader.readAsText(file);

      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const data = JSON.parse(reader.result)
            .map((obj: any) => {
              obj.show = 1
              return obj;
            })
            .map(({ id, del, ...obj }: any) => obj)
          toast.success('备份文件解析成功，开始还原至数据库！')
          await restore(data)
        }
      };
    } catch (error) {
      toast.error('备份文件解析失败！')
    }
  }

  async function onPicImpactRequestUpload(option: any) {
    setRestorePicImpactLoading(true)
    try {
      await readPicImpactJSONFile(option.file)
    } finally {
      setRestorePicImpactLoading(false)
    }
    option.onSuccess(option.file)
  }

  const picimpactProps: UploadProps = {
    className: '!w-full sm:!w-64',
    name: 'file',
    maxCount: 1,
    multiple: false,
    showUploadList: false,
    customRequest: async (file) => await onPicImpactRequestUpload(file),
  };

  return (
    <Card className="flex-1" shadow="sm">
      <CardBody className="space-y-2">
        <Button
          className="!w-full sm:!w-64"
          icon={<CloudDownloadOutlined />}
          loading={backupLoading}
          onClick={() => backup()}
          aria-label="备份"
        >备份</Button>
        <Upload {...picimpactProps}>
          <Button
            className="!w-full sm:!w-64  !block"
            icon={<CloudUploadOutlined />}
            loading={restorePicImpactLoading}
            aria-label="选择备份文件（本机迁移）"
          >选择备份文件（本机迁移）</Button>
        </Upload>
        <p>如果您在线上环境，请确保您的数据库单次会话时长以及事务的支持，否则会还原数据失败！</p>
      </CardBody>
    </Card>
  )
}