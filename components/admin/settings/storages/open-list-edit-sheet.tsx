'use client'

import type { Config } from '~/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-providers'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { useTranslations } from 'next-intl'

export default function OpenListEditSheet() {
  const [loading, setLoading] = useState(false)
  const { mutate } = useSWRConfig()
  const { openListEdit, setOpenListEdit, setOpenListEditData, openListData } = useButtonStore(
    (state) => state,
  )
  const t = useTranslations()

  async function submit() {
    setLoading(true)
    try {
      await fetch('/api/v1/settings/update-open-list-info', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(openListData),
      }).then(res => res.json())
      toast.success(t('Config.updateSuccess'))
      mutate('/api/v1/storage/open-list/info')
      setOpenListEdit(false)
      setOpenListEditData([] as Config[])
    } catch (e) {
      toast.error(t('Config.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      defaultOpen={false}
      open={openListEdit}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setOpenListEdit(false)
          setOpenListEditData([] as Config[])
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide p-2" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>{t('Config.editOpenList')}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-2">
          {
            openListData?.map((config: Config) => (
              <label
                htmlFor="text"
                key={config.id}
                className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
              >
                <span className="text-xs font-medium text-gray-700"> {config.config_key} </span>

                <input
                  type="text"
                  id="name"
                  value={config.config_value || ''}
                  placeholder={t('Config.' + config.config_key)}
                  onChange={(e) => setOpenListEditData(
                    openListData?.map((c: Config) => {
                      if (c.config_key === config.config_key) {
                        c.config_value = e.target.value
                      }
                      return c
                    })
                  )}
                  className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                />
              </label>
            ))
          }
        </div>
        <Button className="cursor-pointer my-2" onClick={() => submit()} disabled={loading}>
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          {t('Config.submit')}
        </Button>
      </SheetContent>
    </Sheet>
  )
}