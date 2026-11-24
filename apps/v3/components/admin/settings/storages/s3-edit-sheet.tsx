'use client'

import type { S3Info } from '~/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-providers'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { useTranslations } from 'next-intl'
import { Switch } from '~/components/ui/switch'

type S3Field =
  | { key: keyof S3Info; type: 'string' }
  | { key: keyof S3Info; type: 'boolean' }

// 字段顺序与展示与原有 Config 数组保持一致；后端键名通过 Config.<dbKey>
// 的国际化条目复用。
const FIELDS: Array<S3Field & { dbKey: string }> = [
  { key: 'accesskeyId', type: 'string', dbKey: 'accesskey_id' },
  { key: 'accesskeySecret', type: 'string', dbKey: 'accesskey_secret' },
  { key: 'region', type: 'string', dbKey: 'region' },
  { key: 'endpoint', type: 'string', dbKey: 'endpoint' },
  { key: 'bucket', type: 'string', dbKey: 'bucket' },
  { key: 'storageFolder', type: 'string', dbKey: 'storage_folder' },
  { key: 'forcePathStyle', type: 'boolean', dbKey: 'force_path_style' },
  { key: 's3Cdn', type: 'boolean', dbKey: 's3_cdn' },
  { key: 's3CdnUrl', type: 'string', dbKey: 's3_cdn_url' },
  { key: 's3DirectDownload', type: 'boolean', dbKey: 's3_direct_download' },
]

export default function S3EditSheet() {
  const [loading, setLoading] = useState(false)
  const { mutate } = useSWRConfig()
  const { s3Edit, setS3Edit, setS3EditData, s3Data } = useButtonStore(
    (state) => state,
  )
  const t = useTranslations()

  async function submit() {
    if (!s3Data) return
    setLoading(true)
    try {
      await fetch('/api/v1/settings/s3-info', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(s3Data),
      }).then(res => res.json())
      toast.success(t('Config.updateSuccess'))
      mutate('/api/v1/settings/s3-info')
      setS3Edit(false)
      setS3EditData(null)
    } catch (e) {
      toast.error(t('Config.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  function updateField<K extends keyof S3Info>(key: K, value: S3Info[K]) {
    if (!s3Data) return
    setS3EditData({ ...s3Data, [key]: value })
  }

  return (
    <Sheet
      defaultOpen={false}
      open={s3Edit}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setS3Edit(false)
          setS3EditData(null)
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide p-2" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>{t('Config.editS3')}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-2">
          {s3Data && FIELDS.map((field) => (
            field.type === 'boolean' ? (
              <div
                key={field.key as string}
                className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <div className="text-tiny text-default-400">
                    {t('Config.' + field.dbKey)}
                  </div>
                </div>
                <Switch
                  className="cursor-pointer"
                  checked={Boolean(s3Data[field.key])}
                  onCheckedChange={(value) => updateField(field.key, value as S3Info[typeof field.key])}
                />
              </div>
            ) : (
              <label
                htmlFor={field.key as string}
                key={field.key as string}
                className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
              >
                <span className="text-xs font-medium text-gray-700"> {field.dbKey} </span>

                <input
                  type="text"
                  id={field.key as string}
                  value={(s3Data[field.key] as string) || ''}
                  placeholder={t('Config.' + field.dbKey)}
                  onChange={(e) => updateField(field.key, e.target.value as S3Info[typeof field.key])}
                  className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                />
              </label>
            )
          ))}
        </div>
        <Button className="cursor-pointer my-2" onClick={() => submit()} disabled={loading}>
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          {t('Config.submit')}
        </Button>
      </SheetContent>
    </Sheet>
  )
}
