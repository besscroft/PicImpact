'use client'

import { useButtonStore } from '~/app/providers/button-store-providers'
import type { ImageType } from '~/types'
import type { ImageServerHandleProps } from '~/types/props'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { Switch } from '~/components/ui/switch'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import { Tag, TagInput } from 'emblor'
import { useTranslations } from 'next-intl'

export default function ImageEditSheet(props : Readonly<ImageServerHandleProps & { pageNum: number } & { album: string }>) {
  const { pageNum, album, ...restProps } = props
  const { mutate } = useSwrInfiniteServerHook(restProps, pageNum, album)
  const { imageEdit, image, setImageEdit, setImageEditData } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  const t = useTranslations()

  async function submit() {
    if (!image.url) {
      toast.error(t('List.imageUrlRequired'))
      return
    }
    if (!image.height || image.height <= 0) {
      toast.error(t('List.imageHeightRequired'))
      return
    }
    if (!image.width || image.width <= 0) {
      toast.error(t('List.imageWidthRequired'))
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/v1/images', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(image),
        method: 'PUT',
      })
      if (!res.ok) {
        toast.error(t('Tips.updateFailed'))
        return
      }
      await res.json()
      toast.success(t('Tips.updateSuccess'))
      setImageEditData({} as ImageType)
      setImageEdit(false)
      await mutate()
    } catch (e) {
      toast.error(t('Tips.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      defaultOpen={false}
      open={imageEdit}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setImageEdit(false)
          setImageEditData({} as ImageType)
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide p-2" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>{t('List.editImage')}</SheetTitle>
        </SheetHeader>
        <div className="mt-2 space-y-2">
          <label
            htmlFor="title"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('List.imageTitle')} </span>

            <input
              type="text"
              id="title"
              placeholder={t('List.inputImageTitle')}
              value={image?.title ?? ''}
              onChange={(e) => setImageEditData({...image, title: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="url"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('List.link')} </span>

            <input
              type="text"
              id="url"
              placeholder={t('List.inputLink')}
              value={image?.url ?? ''}
              onChange={(e) => setImageEditData({...image, url: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="preview_url"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('List.previewLink')} </span>

            <input
              type="text"
              id="preview_url"
              placeholder={t('List.inputPreviewLink')}
              value={image?.preview_url ?? ''}
              onChange={(e) => setImageEditData({...image, preview_url: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="video_url"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('List.videoLink')} </span>

            <input
              type="text"
              id="video_url"
              placeholder={t('List.inputVideoLink')}
              value={image?.video_url ?? ''}
              onChange={(e) => setImageEditData({...image, video_url: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="detail"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('List.detail')} </span>

            <input
              type="text"
              id="detail"
              placeholder={t('List.inputDetail')}
              value={image?.detail ?? ''}
              onChange={(e) => setImageEditData({...image, detail: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="width"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('List.widthPx')} </span>

            <input
              type="number"
              id="width"
              value={image?.width ?? ''}
              onChange={(e) => setImageEditData({...image, width: Number(e.target.value)})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="height"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('List.heightPx')} </span>

            <input
              type="number"
              id="height"
              value={image?.height ?? ''}
              onChange={(e) => setImageEditData({...image, height: Number(e.target.value)})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="lon"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('List.longitude')} </span>

            <input
              type="text"
              id="lon"
              placeholder={t('List.inputLongitude')}
              value={image?.lon ?? ''}
              onChange={(e) => setImageEditData({...image, lon: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="lat"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('List.latitude')} </span>

            <input
              type="text"
              id="lat"
              placeholder={t('List.inputLatitude')}
              value={image?.lat ?? ''}
              onChange={(e) => setImageEditData({...image, lat: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="sort"
            className="block overflow-hidden rounded-md border border-input px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
          >
            <span className="text-xs font-medium text-gray-700"> {t('List.sort')} </span>

            <input
              type="number"
              id="sort"
              value={image?.sort ?? ''}
              onChange={(e) => setImageEditData({...image, sort: Number(e.target.value)})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <TagInput
            tags={!image.labels ? [] : image.labels.map((label: string) => ({ id: Math.floor(Math.random() * 1000), text: label }))}
            setTags={(newTags: any) => {
              setImageEditData({...image, labels: newTags?.map((label: Tag) => label.text)})
            }}
            placeholder={t('List.indexTagPlaceholder')}
            styleClasses={{
              inlineTagsContainer:
                'border-input rounded-lg bg-background shadow-sm shadow-black/5 transition-shadow focus-within:border-ring focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/20 p-1 gap-1',
              input: 'w-full min-w-[80px] focus-visible:outline-none shadow-none px-2 h-7',
              tag: {
                body: 'h-7 relative bg-background border border-input hover:bg-background rounded-md font-medium text-xs ps-2 pe-7',
                closeButton:
                  'absolute -inset-y-px -end-px p-0 rounded-e-lg flex size-7 transition-colors outline-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 text-muted-foreground/80 hover:text-foreground',
              },
            }}
            activeTagIndex={activeTagIndex}
            setActiveTagIndex={setActiveTagIndex}
          />
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="text-medium">{t('List.showStatus')}</div>
              <div className="text-tiny text-default-400">
                {t('List.showStatusDesc')}
              </div>
            </div>
            <Switch
              className="cursor-pointer"
              checked={image?.show === 0}
              onCheckedChange={(value) => setImageEditData({...image, show: value ? 0 : 1})}
            />
          </div>
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="text-medium">{t('List.homepageShowStatus')}</div>
              <div className="text-tiny text-default-400">
                {t('List.homepageShowStatusDesc')}
              </div>
            </div>
            <Switch
              className="cursor-pointer"
              checked={image?.show_on_mainpage === 0}
              onCheckedChange={(value) => setImageEditData({...image, show_on_mainpage: value ? 0 : 1})}
            />
          </div>
          <Button
            className="cursor-pointer"
            disabled={loading}
            onClick={() => submit()}
            aria-label={t('Button.update')}
          >
            {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
            {t('Button.update')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
