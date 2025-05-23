'use client'

import { Card } from '~/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { Button } from '~/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'
import React from 'react'
import AlistEditSheet from '~/components/admin/settings/storages/alist-edit-sheet'
import { useTranslations } from 'next-intl'

export default function AlistTabs() {
  const { data, error, isValidating, mutate } = useSWR('/api/v1/storage/alist/info', fetcher
    , { revalidateOnFocus: false })
  const { setAListEdit, setAListEditData } = useButtonStore(
    (state) => state,
  )
  const t = useTranslations()

  if (error) {
    toast.error(t('Config.requestFailed'))
  }

  return (
    <div className="space-y-2">
      <Card className="py-0">
        <div className="flex justify-between p-2">
          <div className="flex gap-5">
            <div className="flex flex-col gap-1 items-start justify-center">
              <h4 className="text-small font-semibold leading-none text-default-600">{t('Config.alistTitle')}</h4>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => mutate()}
              aria-label={t('Config.refresh')}
            >
              {isValidating && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              {t('Config.refresh')}
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setAListEdit(true)
                setAListEditData(JSON.parse(JSON.stringify(data)))
              }}
              aria-label={t('Config.edit')}
            >
              {t('Config.edit')}
            </Button>
          </div>
        </div>
      </Card>
      {
        data &&
        <Card className="p-2">
          <Table aria-label={t('Config.alistTitle')}>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.config_key}</TableCell>
                  <TableCell className="truncate max-w-48">{item.config_value || 'N&A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      }
      {Array.isArray(data) && data.length > 0 && <AlistEditSheet />}
    </div>
  )
}