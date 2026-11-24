'use client'

import type { OpenListInfo } from '~/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-providers'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { useTranslations } from 'next-intl'

const FIELDS: Array<{ key: keyof OpenListInfo; dbKey: string }> = [
  { key: 'openListUrl', dbKey: 'open_list_url' },
  { key: 'openListToken', dbKey: 'open_list_token' },
]

export default function OpenListEditSheet() {
  const [loading, setLoading] = useState(false)
  const { mutate } = useSWRConfig()
  const { openListEdit, setOpenListEdit, setOpenListEditData, openListData } = useButtonStore(
    (state) => state,
  )
  const t = useTranslations()

  async function submit() {
    if (!openListData) return
    setLoading(true)
    try {
      await fetch('/api/v1/settings/open-list-info', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(openListData),
      }).then(res => res.json())
      toast.success(t('Config.updateSuccess'))
      mutate('/api/v1/storage/open-list/info')
      setOpenListEdit(false)
      setOpenListEditData(null)
    } catch (e) {
      toast.error(t('Config.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  function updateField<K extends keyof OpenListInfo>(key: K, value: OpenListInfo[K]) {
    if (!openListData) return
    setOpenListEditData({ ...openListData, [key]: value })
  }

  return (
    <Sheet
      defaultOpen={false}
      open={openListEdit}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setOpenListEdit(false)
          setOpenListEditData(null)
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide p-2" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>{t('Config.editOpenList')}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-2">
          {openListData && FIELDS.map((field) => (
            <label
              htmlFor={field.key as string}
              key={field.key as string}
              className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            >
              <span className="text-xs font-medium text-gray-700"> {field.dbKey} </span>

              <input
                type="text"
                id={field.key as string}
                value={(openListData[field.key] as string) || ''}
                placeholder={t('Config.' + field.dbKey)}
                onChange={(e) => updateField(field.key, e.target.value as OpenListInfo[typeof field.key])}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
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
