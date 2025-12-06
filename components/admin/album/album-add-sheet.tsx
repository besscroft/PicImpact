'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-providers'
import type { AlbumType } from '~/types'
import type { HandleProps } from '~/types/props'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useTranslations } from 'next-intl'
import { Label } from '~/components/ui/label.tsx'

export default function AlbumAddSheet(props : Readonly<HandleProps>) {
  const { mutate } = useSwrHydrated(props)
  const { albumAdd, setAlbumAdd } = useButtonStore(
    (state) => state,
  )
  const [data, setData] = useState({} as AlbumType)
  const [loading, setLoading] = useState(false)
  const t = useTranslations()

  async function submit() {
    if (!data.name || !data.album_value) {
      toast.error(t('Album.requiredFields'))
      return
    }
    if (data.album_value && data.album_value.charAt(0) !== '/') {
      toast.error(t('Album.routerStartWithSlash'))
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/v1/albums/add', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        method: 'POST',
      }).then(response => response.json())
      if (res.code === 200) {
        toast.success(t('Tips.addSuccess'))
        setAlbumAdd(false)
        setData({} as AlbumType)
        await mutate()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error(t('Tips.addFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      defaultOpen={false}
      open={albumAdd}
      onOpenChange={() => setAlbumAdd(!albumAdd)}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>{t('Album.addAlbum')}</SheetTitle>
          <SheetDescription className="space-y-2">
            <label
              htmlFor="name"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <span className="text-xs font-medium text-gray-700">{t('Album.name')}</span>

              <input
                type="text"
                id="name"
                value={data?.name}
                placeholder={t('Album.inputName')}
                onChange={(e) => setData({...data, name: e.target.value})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
            <label
              htmlFor="album_value"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <span className="text-xs font-medium text-gray-700">{t('Album.router')}</span>

              <input
                type="text"
                id="album_value"
                value={data?.album_value}
                placeholder={t('Album.inputRouter')}
                onChange={(e) => setData({...data, album_value: e.target.value})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
            <label
              htmlFor="detail"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <span className="text-xs font-medium text-gray-700">{t('Album.detail')}</span>

              <input
                type="text"
                id="detail"
                value={data?.detail || ''}
                placeholder={t('Album.inputDetail')}
                onChange={(e) => setData({...data, detail: e.target.value})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
            <label
              htmlFor="sort"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <span className="text-xs font-medium text-gray-700">{t('Album.sort')}</span>

              <input
                type="number"
                id="sort"
                value={data?.sort}
                placeholder="0"
                onChange={(e) => setData({...data, sort: Number(e.target.value)})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
            <label
            htmlFor="detail"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700">{t('Album.license')}</span>

            <input
              type="text"
              id="detail"
              value={data?.license || ''}
              placeholder={t('Album.licensePlaceholder')}
              onChange={(e) => setData({...data, license: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
            </label>
            <div className="w-full max-w-sm space-y-1">
              <Label htmlFor="indexStyleSelect"> {t('Preferences.indexThemeSelect')} </Label>
              <Select value={data?.theme || '0'} onValueChange={(value) => setData({...data, theme: value})}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder={t('Preferences.indexThemeSelect')} />
                </SelectTrigger>
                <SelectContent className="cursor-pointer">
                  <SelectItem className="cursor-pointer" value="0">{t('Theme.indexDefaultStyle')}</SelectItem>
                  <SelectItem className="cursor-pointer" value="1">{t('Theme.indexSimpleStyle')}</SelectItem>
                  <SelectItem className="cursor-pointer" value="2">{t('Theme.indexPolaroidStyle')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="text-medium">{t('Album.showStatus')}</div>
                <div className="text-tiny text-default-400">
                  {t('Album.showStatusDesc')}
                </div>
              </div>
              <Switch
                className="cursor-pointer"
                checked={data?.show === 0}
                onCheckedChange={(value) => {
                  setData({...data, show: value ? 0 : 1})
                }}
              />
            </div>
            <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="text-medium">{t('Album.randomSort')}</div>
                <div className="text-tiny text-default-400">
                  {t('Album.randomSortDesc')}
                </div>
              </div>
              <Switch
                className="cursor-pointer"
                checked={data?.random_show === 0}
                onCheckedChange={(value) => {
                  setData({...data, random_show: value ? 0 : 1})
                }}
              />
            </div>
            <div className="flex flex-col gap-1 rounded-lg border p-3 shadow-sm">
              <div className="text-medium">{t('Album.imageSortRule')}</div>
              <Select
                value={typeof data.image_sorting === 'number' ? data.image_sorting.toString() : '1'}
                onValueChange={(value) => {
                  setData({
                    ...data,
                    image_sorting: parseInt(value),
                  })
                }}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder={t('Album.selectSortRule')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem className="cursor-pointer" value="1">{t('Album.uploadTimeNewToOld')}</SelectItem>
                    <SelectItem className="cursor-pointer" value="2">{t('Album.shootTimeNewToOld')}</SelectItem>
                    <SelectItem className="cursor-pointer" value="3">{t('Album.uploadTimeOldToNew')}</SelectItem>
                    <SelectItem className="cursor-pointer" value="4">{t('Album.shootTimeOldToNew')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="cursor-pointer"
              disabled={loading}
              onClick={() => submit()}
              aria-label={t('Album.submit')}
            >
              {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
              {t('Album.submit')}
            </Button>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}
