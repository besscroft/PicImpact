'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'
import { useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Slider } from '~/components/ui/slider'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'

export default function DailySettings() {
  const [dailyEnabled, setDailyEnabled] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState('24')
  const [totalCount, setTotalCount] = useState('30')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [albumWeights, setAlbumWeights] = useState<Array<{ id: string, name: string, album_value: string, daily_weight: number, photo_count: number }>>([])
  const t = useTranslations()

  const { data: configData, isValidating: configValidating, isLoading: configLoading, mutate: mutateConfig } = useSWR('/api/v1/daily/config', fetcher)
  const { data: albumsData, isValidating: albumsValidating, isLoading: albumsLoading } = useSWR('/api/v1/daily/albums', fetcher)

  useEffect(() => {
    if (configData) {
      setDailyEnabled(configData.find((item: { config_key: string, config_value: string }) => item.config_key === 'daily_enabled')?.config_value === 'true')
      setRefreshInterval(configData.find((item: { config_key: string, config_value: string }) => item.config_key === 'daily_refresh_interval')?.config_value || '24')
      setTotalCount(configData.find((item: { config_key: string, config_value: string }) => item.config_key === 'daily_total_count')?.config_value || '30')
    }
  }, [configData])

  useEffect(() => {
    if (albumsData) {
      setAlbumWeights(albumsData.map((a: { id: string, name: string, album_value: string, daily_weight: number, photo_count: number }) => ({ ...a, daily_weight: Number(a.daily_weight) })))
    }
  }, [albumsData])

  const lastRefresh = configData?.find((item: { config_key: string, config_value: string }) => item.config_key === 'daily_last_refresh')?.config_value
  const lastRefreshDate = lastRefresh ? new Date(lastRefresh) : null
  const intervalHours = parseInt(refreshInterval, 10)
  const nextRefreshDate = lastRefreshDate ? new Date(lastRefreshDate.getTime() + intervalHours * 60 * 60 * 1000) : null

  const totalWeight = useMemo(() => albumWeights.reduce((sum, a) => sum + a.daily_weight, 0), [albumWeights])
  const participatingCount = useMemo(() => albumWeights.filter(a => a.daily_weight > 0).length, [albumWeights])

  const getEstimatedQuota = (weight: number, photoCount: number) => {
    if (totalWeight === 0 || weight === 0) return 0
    const total = parseInt(totalCount, 10) || 30
    return Math.min(photoCount, Math.ceil((weight / totalWeight) * total))
  }

  const updateWeight = (id: string, weight: number) => {
    setAlbumWeights(prev => prev.map(a => a.id === id ? { ...a, daily_weight: weight } : a))
  }

  async function saveAll() {
    const count = parseInt(totalCount, 10)
    if (isNaN(count) || count < 1) {
      toast.error(t('Daily.saveFailed'))
      return
    }
    try {
      setLoading(true)
      const results = await Promise.all([
        fetch('/api/v1/daily/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dailyEnabled,
            dailyRefreshInterval: refreshInterval,
            dailyTotalCount: count,
          }),
        }),
        fetch('/api/v1/daily/albums', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            albumWeights.map(a => ({ id: a.id, dailyWeight: a.daily_weight }))
          ),
        }),
      ])
      if (results.some(r => !r.ok)) throw new Error('Request failed')
      await mutateConfig()
      toast.success(t('Daily.saveSuccess'))
    } catch {
      toast.error(t('Daily.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true)
      const res = await fetch('/api/v1/daily/refresh', { method: 'POST' })
      if (!res.ok) throw new Error('Request failed')
      await mutateConfig()
      toast.success(t('Daily.refreshSuccess'))
    } catch {
      toast.error(t('Daily.refreshFailed'))
    } finally {
      setRefreshing(false)
    }
  }

  const isDisabled = configValidating || configLoading || albumsValidating || albumsLoading

  return (
    <div className="flex flex-col space-y-4 h-full flex-1">
      <div className="flex justify-between space-x-1">
        <div>{t('Daily.title')}</div>
        <Button
          variant="outline"
          disabled={loading || isDisabled}
          onClick={() => saveAll()}
          aria-label={t('Button.submit')}
          className="cursor-pointer"
        >
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          {t('Button.submit')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
        <div className="rounded space-y-4">
          <label
            htmlFor="dailyEnabled"
            className="w-full max-w-sm cursor-pointer block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700">{t('Daily.enabled')}</span>
            <p className="text-xs text-muted-foreground mt-1">{t('Daily.enabledDescription')}</p>
            <div className="mt-2">
              <Switch
                id="dailyEnabled"
                disabled={isDisabled}
                checked={dailyEnabled}
                className="cursor-pointer"
                onCheckedChange={setDailyEnabled}
              />
            </div>
          </label>

          <div className="w-full max-w-sm space-y-1">
            <Label>{t('Daily.refreshInterval')}</Label>
            <Select value={refreshInterval} onValueChange={setRefreshInterval}>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="cursor-pointer">
                <SelectItem className="cursor-pointer" value="6">{t('Daily.every6Hours')}</SelectItem>
                <SelectItem className="cursor-pointer" value="12">{t('Daily.every12Hours')}</SelectItem>
                <SelectItem className="cursor-pointer" value="24">{t('Daily.everyDay')}</SelectItem>
                <SelectItem className="cursor-pointer" value="168">{t('Daily.everyWeek')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="totalCount">{t('Daily.totalCount')}</Label>
            <Input
              type="number"
              id="totalCount"
              min={1}
              disabled={isDisabled}
              value={totalCount}
              onChange={(e) => setTotalCount(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>{t('Daily.lastRefresh')}</Label>
            <p className="text-sm text-muted-foreground">
              {lastRefreshDate ? lastRefreshDate.toLocaleString() : t('Daily.neverRefreshed')}
            </p>
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>{t('Daily.nextRefresh')}</Label>
            <p className="text-sm text-muted-foreground">
              {nextRefreshDate ? nextRefreshDate.toLocaleString() : t('Daily.neverRefreshed')}
            </p>
          </div>
          <Button
            variant="outline"
            disabled={refreshing || isDisabled}
            onClick={handleRefresh}
            className="cursor-pointer"
          >
            {refreshing && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
            {t('Daily.manualRefresh')}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('Daily.albumWeights')}</Label>
          <span className="text-sm text-muted-foreground">
            {t('Daily.totalParticipating')}: {participatingCount}
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Daily.albumName')}</TableHead>
              <TableHead className="w-[100px]">{t('Daily.photoCount')}</TableHead>
              <TableHead className="w-[200px]">{t('Daily.weight')}</TableHead>
              <TableHead className="w-[120px]">{t('Daily.estimatedQuota')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {albumWeights.map((album) => (
              <TableRow key={album.id}>
                <TableCell>{album.name}</TableCell>
                <TableCell>{album.photo_count}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[album.daily_weight]}
                      onValueChange={([val]) => updateWeight(album.id, val)}
                      max={10}
                      step={1}
                      className="w-[120px]"
                    />
                    <span className="text-sm w-8 text-center">
                      {album.daily_weight > 0 ? album.daily_weight : t('Daily.notParticipating')}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getEstimatedQuota(album.daily_weight, album.photo_count)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
