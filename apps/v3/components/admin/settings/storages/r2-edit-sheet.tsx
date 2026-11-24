'use client'

import type { R2Info } from '~/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-providers'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { useTranslations } from 'next-intl'
import { Switch } from '~/components/ui/switch'

type R2Field =
  | { key: keyof R2Info; type: 'string' }
  | { key: keyof R2Info; type: 'boolean' }

const FIELDS: Array<R2Field & { dbKey: string }> = [
  { key: 'r2AccesskeyId', type: 'string', dbKey: 'r2_accesskey_id' },
  { key: 'r2AccesskeySecret', type: 'string', dbKey: 'r2_accesskey_secret' },
  { key: 'r2AccountId', type: 'string', dbKey: 'r2_account_id' },
  { key: 'r2Bucket', type: 'string', dbKey: 'r2_bucket' },
  { key: 'r2StorageFolder', type: 'string', dbKey: 'r2_storage_folder' },
  { key: 'r2PublicDomain', type: 'string', dbKey: 'r2_public_domain' },
  { key: 'r2DirectDownload', type: 'boolean', dbKey: 'r2_direct_download' },
]

export default function R2EditSheet() {
  const [loading, setLoading] = useState(false)
  const { mutate } = useSWRConfig()
  const { r2Edit, setR2Edit, setR2EditData, r2Data } = useButtonStore(
    (state) => state,
  )
  const t = useTranslations()

  async function submit() {
    if (!r2Data) return
    setLoading(true)
    try {
      await fetch('/api/v1/settings/r2-info', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(r2Data),
      }).then(res => res.json())
      toast.success(t('Config.updateSuccess'))
      mutate('/api/v1/settings/r2-info')
      setR2Edit(false)
      setR2EditData(null)
    } catch (e) {
      toast.error(t('Config.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  function updateField<K extends keyof R2Info>(key: K, value: R2Info[K]) {
    if (!r2Data) return
    setR2EditData({ ...r2Data, [key]: value })
  }

  return (
    <Sheet
      defaultOpen={false}
      open={r2Edit}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setR2Edit(false)
          setR2EditData(null)
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide p-2" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>{t('Config.editR2')}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-2">
          {r2Data && FIELDS.map((field) => (
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
                  checked={Boolean(r2Data[field.key])}
                  onCheckedChange={(value) => updateField(field.key, value as R2Info[typeof field.key])}
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
                  value={(r2Data[field.key] as string) || ''}
                  placeholder={t('Config.' + field.dbKey)}
                  onChange={(e) => updateField(field.key, e.target.value as R2Info[typeof field.key])}
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
