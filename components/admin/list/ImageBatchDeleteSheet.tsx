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

export default function ImageBatchDeleteSheet(props : Readonly<ImageServerHandleProps & { dataProps: DataProps } & { pageNum: number } & { album: string }>) {
  const { dataProps, pageNum, album, ...restProps } = props
  const { mutate } = useSWRInfiniteServerHook(restProps, pageNum, album)
  const { imageBatchDelete, setImageBatchDelete } = useButtonStore(
    (state) => state,
  )
  const [isOpen, setIsOpen] = useState(false)
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
      setIsOpen(false)
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
      <SheetContent side="left" className="overflow-y-auto scrollbar-hide" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>批量删除</SheetTitle>
        </SheetHeader>
        <div className="space-y-2">
          {
            dataProps.data && dataProps.data.map((item: ImageType) => (
              <div key={item.id} className="flex flex-row items-center justify-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <Checkbox
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
                <Avatar>
                  <AvatarImage src={item.preview_url || item.preview_url} alt="avatar"/>
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="space-y-1 leading-none">
                  <div>
                    {item.id.substring(0, 16) + '...'}
                  </div>
                  <div>
                    {item.title ? item.title.length > 16 ? item.title.substring(0, 16) + '...' : item.title : 'N&A'}
                  </div>
                </div>
              </div>
            ))
          }
          <Dialog>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  if (data.length === 0) {
                    toast.warning('请选择要删除的图片')
                    return
                  } else {
                    setIsOpen(true)
                  }
                }}
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