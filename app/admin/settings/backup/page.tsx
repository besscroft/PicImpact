'use client'

import { Card, CardBody } from '@nextui-org/react'
import React, { useState } from 'react'
import { CloudUploadOutlined, CloudDownloadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Button, Upload } from 'antd'
import { toast } from 'sonner'
import dayjs from 'dayjs'

export default function Backup() {
  const [data, setData] = useState<any[]>([])
  const [restoreKameraLoading, setRestoreKameraLoading] = useState(false)
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

  function readKameraJSONFile(file: File) {
    try {
      let reader = new FileReader();
      reader.readAsText(file);

      reader.onload = function() {
        if (typeof reader.result === 'string') {
          setData(JSON.parse(reader.result)
            .map((obj: any) => {
              obj.tag = `/${obj.type}`
              obj.show = 1
              return obj;
            })
            .map(({ id, del, ...obj }: any) => obj)
            .map(({ type, ...obj }: any) => obj)
          )
        }
      };
      toast.success('备份文件解析成功，开始还原至数据库！')
    } catch (error) {
      toast.error('备份文件解析失败！')
    }
  }

  function readPicImpactJSONFile(file: File) {
    try {
      let reader = new FileReader();
      reader.readAsText(file);

      reader.onload = function() {
        if (typeof reader.result === 'string') {
          setData(JSON.parse(reader.result)
            .map((obj: any) => {
              obj.show = 1
              return obj;
            })
            .map(({ id, del, ...obj }: any) => obj)
          )
        }
      };
      toast.success('备份文件解析成功，开始还原至数据库！')
    } catch (error) {
      toast.error('备份文件解析失败！')
    }
  }

  async function restore() {
    try {
      await fetch('/api/v1/restore-images-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      toast.success('还原成功！')
    } catch (e) {
      toast.error('还原失败！')
    }
  }

  const kameraProps: UploadProps = {
    name: 'file',
    maxCount: 1,
    multiple: false,
    showUploadList: false,
    async onChange(info: any) {
      setRestoreKameraLoading(true)
      try {
        readKameraJSONFile(info.file.originFileObj)
        await restore()
      } finally {
        setRestoreKameraLoading(false)
      }
    },
  };

  const picimpactProps: UploadProps = {
    name: 'file',
    maxCount: 1,
    multiple: false,
    showUploadList: false,
    async onChange(info: any) {
      setRestorePicImpactLoading(true)
      try {
        readPicImpactJSONFile(info.file.originFileObj)
        await restore()
      } finally {
        setRestorePicImpactLoading(false)
      }
    },
  };

  return (
    <Card className="flex-1" shadow="sm">
      <CardBody className="space-y-2">
        <Upload {...kameraProps}>
          <Button
            icon={<CloudUploadOutlined />}
            loading={restoreKameraLoading}
          >选择备份文件（从 Kamera 迁移）</Button>
        </Upload>
        <Button
          className="w-64"
          icon={<CloudDownloadOutlined />}
          loading={backupLoading}
          onClick={() => backup()}
        >备份</Button>
        <Upload {...picimpactProps}>
          <Button
            icon={<CloudUploadOutlined />}
            loading={restorePicImpactLoading}
          >选择备份文件（本机迁移）</Button>
        </Upload>
      </CardBody>
    </Card>
  )
}