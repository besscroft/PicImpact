'use client'

import { DataProps, ImageServerHandleProps, ImageType } from '~/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import React, { useState } from 'react'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { toast } from 'sonner'
import { useSWRInfiniteServerHook } from '~/hooks/useSWRInfiniteServerHook'
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
import { Label } from '~/components/ui/label.tsx'

export default function ImageBatchDeleteSheet(props : Readonly<ImageServerHandleProps & { dataProps: DataProps } & { pageNum: number } & { album: string }>) {
  const { dataProps, pageNum, album, ...restProps } = props
  const { mutate } = useSWRInfiniteServerHook(restProps, pageNum, album)
  const { imageBatchDelete, setImageBatchDelete } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([] as any[])

  async function submit() {
    if (data.length === 0) {
      toast.warning('请选择要删除的图片')
      return
    }
    try {
      setLoading(true)
      await fetch('/api/v1/images/batch-delete', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        method: 'DELETE',
      }).then(response => response.json())
      toast.success('删除成功！')
      setImageBatchDelete(false)
      setData([])
      await mutate()
    } catch (e) {
      toast.error('删除失败！')
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
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>批量删除</SheetTitle>
        </SheetHeader>
        <div className="space-y-2">
          {
            dataProps.data && dataProps.data.map((item: ImageType) => (
              <div
                key={item.id}
                className="relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring">
                <Checkbox
                  className="order-1 after:absolute after:inset-0"
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
                disabled={data.length === 0}
                aria-label="更新"
              >
                删除
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>确定要删掉？</DialogTitle>
              </DialogHeader>
              <div>
                {data && data?.map((item: string) => (
                  <div key={item}>图片 ID：{item}</div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  disabled={loading}
                  onClick={() => submit()}
                  aria-label="确认删除"
                >
                  {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
                  删除
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SheetContent>
    </Sheet>
  )
}