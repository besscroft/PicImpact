'use client'

import type { ImageType } from '~/types'
import type { ImageListDataProps, ImageServerHandleProps } from '~/types/props'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import React, { useState } from 'react'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { toast } from 'sonner'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/ui/avatar'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { useSwrPageTotalServerHook } from '~/hooks/use-swr-page-total-server-hook'
import { useTranslations } from 'next-intl'

export default function ImageBatchDeleteSheet(props : Readonly<ImageServerHandleProps & { dataProps: ImageListDataProps } & { pageNum: number } & { album: string }>) {
  const { dataProps, pageNum, album, ...restProps } = props
  const { mutate } = useSwrInfiniteServerHook(restProps, pageNum, album)
  const { mutate: totalMutate } = useSwrPageTotalServerHook(props, album)
  const { imageBatchDelete, setImageBatchDelete } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([] as any[])
  const t = useTranslations()

  async function submit() {
    if (data.length === 0) {
      toast.warning(t('List.selectImagesToDelete'))
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/v1/images/batch-delete', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        method: 'DELETE',
      })
      if (!res.ok) {
        toast.error(t('Tips.deleteFailed'))
        return
      }
      await res.json()
      toast.success(t('Tips.deleteSuccess'))
      setImageBatchDelete(false)
      setData([])
      await mutate()
      await totalMutate()
    } catch (e) {
      toast.error(t('Tips.deleteFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      defaultOpen={false}
      open={imageBatchDelete}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setImageBatchDelete(false)
          setData([])
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide p-2" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>{t('List.batchDelete')}</SheetTitle>
        </SheetHeader>
        <div className="space-y-2">
          {
            dataProps.data && dataProps.data.map((item: ImageType) => (
              <div
                key={item.id}
                className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
                <Checkbox
                  className="cursor-pointer order-1 after:absolute after:inset-0"
                  checked={data?.includes(item.id)}
                  onCheckedChange={(checked) => {
                    return checked
                      ? setData([...data, item.id])
                      : setData(
                        data?.filter(
                          (value) => value !== item.id
                        )
                      )
                  }}
                />
                <div className="flex grow items-center gap-3">
                  <Avatar>
                    <AvatarImage src={item.preview_url || item.preview_url} alt="avatar"/>
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-2">
                    <Label htmlFor="checkbox-15">
                      {item.id.substring(0, 16) + '...'}
                    </Label>
                    <p id="checkbox-15-description" className="text-xs text-muted-foreground">
                      {item.title ? item.title.length > 16 ? item.title.substring(0, 20) + '...' : item.title : 'N&A'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          }
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="cursor-pointer"
                disabled={data.length === 0}
                aria-label={t('Button.delete')}
              >
                {t('Button.delete')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('List.confirmDelete')}</DialogTitle>
              </DialogHeader>
              <div>
                {data && data?.map((item: string) => (
                  <div key={item}>{t('List.imageId', { id: item })}</div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  className="cursor-pointer"
                  disabled={loading}
                  onClick={() => submit()}
                  aria-label={t('Button.yesDelete')}
                >
                  {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
                  {t('Button.delete')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SheetContent>
    </Sheet>
  )
}
