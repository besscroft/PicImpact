'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { ReloadIcon } from '@radix-ui/react-icons'

import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { fetcher } from '~/lib/utils/fetcher'
import type { VariantStorageInfo } from '~/types'

// Radix Select forbids an empty-string item value, so the "off" option uses a
// sentinel that maps to '' on save.
const OFF = 'off'
type Selection = typeof OFF | 's3' | 'r2'

export default function VariantStorageCard() {
  const t = useTranslations()
  const { data, error, isValidating, mutate } = useSWR<VariantStorageInfo>(
    '/api/v1/settings/variant-storage',
    fetcher,
    { revalidateOnFocus: false },
  )
  const [selection, setSelection] = useState<Selection>(OFF)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (data) {
      setSelection(data.variantStorage === 's3' || data.variantStorage === 'r2' ? data.variantStorage : OFF)
    }
  }, [data])

  if (error) {
    toast.error(t('Config.requestFailed'))
  }

  async function save() {
    setSaving(true)
    try {
      const payload: VariantStorageInfo = { variantStorage: selection === OFF ? '' : selection }
      const res = await fetch('/api/v1/settings/variant-storage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      // fetch doesn't throw on 4xx/5xx, so check explicitly — otherwise a failed
      // PUT would wrongly toast success and the admin would think the backend is
      // set while variantBaseUrl stays empty and backfill can't run.
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
      }
      toast.success(t('Config.updateSuccess'))
      mutate()
    } catch {
      toast.error(t('Config.updateFailed'))
    } finally {
      setSaving(false)
    }
  }

  const isOff = selection === OFF

  return (
    <Card className="p-4 space-y-3">
      <div className="flex flex-col gap-1">
        <h4 className="text-small font-semibold leading-none text-default-600">{t('Config.variantStorageTitle')}</h4>
        <p className="text-xs text-muted-foreground">{t('Config.variantStorageDesc')}</p>
      </div>
      <div className="flex items-center gap-2">
        <Select value={selection} onValueChange={(value) => setSelection(value as Selection)}>
          <SelectTrigger className="w-48" aria-label={t('Config.variantStorageTitle')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={OFF}>{t('Config.variantStorageOff')}</SelectItem>
            <SelectItem value="s3">S3 API</SelectItem>
            <SelectItem value="r2">Cloudflare R2</SelectItem>
          </SelectContent>
        </Select>
        <Button className="cursor-pointer" disabled={saving} onClick={save} aria-label={t('Config.submit')}>
          {saving && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          {t('Config.submit')}
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer"
          disabled={isValidating}
          onClick={() => mutate()}
          aria-label={t('Config.refresh')}
        >
          {isValidating && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          {t('Config.refresh')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {isOff ? t('Config.variantStorageNotEnabled') : t('Config.variantStorageHelper')}
      </p>
    </Card>
  )
}
