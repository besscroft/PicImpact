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
import { useSWRConfig } from 'swr'
import { useTranslations } from 'next-intl'

export default function AlistTabs() {
  const { mutate } = useSWRConfig()
  const { setAlistEdit, setAlistEditData, alistData } = useButtonStore(
    (state) => state,
  )
  const t = useTranslations()

  async function refresh() {
    try {
      await mutate('/api/v1/settings/alist-info')
    } catch (e) {
      toast.error(t('Config.requestFailed'))
    }
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
              onClick={() => refresh()}
              aria-label="刷新"
            >
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setAlistEdit(true)
                setAlistEditData(alistData)
              }}
              aria-label="编辑"
            >
              {t('Config.edit')}
            </Button>
          </div>
        </div>
      </Card>
      {
        alistData &&
        <Card className="p-2">
          <Table aria-label={t('Config.alistTitle')}>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Config.key')}</TableHead>
                <TableHead>{t('Config.value')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alistData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.config_key}</TableCell>
                  <TableCell className="truncate max-w-48">{item.config_value || 'N&A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      }
      {Array.isArray(alistData) && alistData.length > 0 && <AlistEditSheet />}
    </div>
  )
}