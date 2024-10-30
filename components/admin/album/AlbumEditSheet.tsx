'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { HandleProps, AlbumType } from '~/types'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import { Button, cn, Input, Switch, Textarea } from '@nextui-org/react'
import { useState } from 'react'
import { toast } from 'sonner'

export default function AlbumEditSheet(props : Readonly<HandleProps>) {
  const { mutate } = useSWRHydrated(props)
  const { albumEdit, album, setAlbumEdit, setAlbumEditData } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!album?.name || !album?.album_value) {
      toast.error('请先填写必填项！')
      return
    }
    if (album.album_value && album.album_value.charAt(0) !== '/') {
      toast.error('路由必须以 / 开头！')
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/v1/albums/update', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(album),
        method: 'PUT',
      }).then(response => response.json())
      if (res.code === 200) {
        toast.success('更新成功！')
        setAlbumEditData({} as AlbumType)
        setAlbumEdit(false)
        await mutate()
      } else {
        toast.error(res.message)
      }
    } catch (e) {
      toast.error('更新失败！')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      defaultOpen={false}
      open={albumEdit}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setAlbumEdit(false)
          setAlbumEditData({} as AlbumType)
        }
      }}
      modal={false}
    >
      <SheetContent side="left" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>编辑相册</SheetTitle>
          <SheetDescription className="space-y-2">
            <Input
              isRequired
              value={album?.name}
              onValueChange={(value) => setAlbumEditData({ ...album, name: value })}
              isClearable
              type="text"
              variant="bordered"
              label="相册名称"
              placeholder="输入相册名称"
            />
            <Input
              isRequired
              value={album?.album_value}
              onValueChange={(value) => setAlbumEditData({ ...album, album_value: value })}
              isClearable
              type="text"
              variant="bordered"
              label="路由"
              placeholder="输入路由，如：/tietie"
            />
            <Textarea
              value={album?.detail}
              onValueChange={(value) => setAlbumEditData({ ...album, detail: value })}
              label="详情"
              variant="bordered"
              placeholder="输入详情"
              disableAnimation
              disableAutosize
              classNames={{
                input: "resize-y min-h-[40px]",
              }}
            />
            <Input
              value={String(album?.sort)}
              onValueChange={(value) => setAlbumEditData({ ...album, sort: Number(value) })}
              type="number"
              variant="bordered"
              label="排序"
              placeholder="0"
            />
            <Switch
              isSelected={album?.show === 0}
              value={album?.show === 0 ? 'true' : 'false'}
              onValueChange={(value) => {
                setAlbumEditData({ ...album, show: value ? 0 : 1 })
              }}
              classNames={{
                base: cn(
                  "inline-flex flex-row-reverse w-full max-w-full bg-content1 hover:bg-content2 items-center",
                  "justify-between cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent",
                  "data-[selected=true]:border-primary",
                ),
                wrapper: "p-0 h-4 overflow-visible",
                thumb: cn("w-6 h-6 border-2 shadow-lg",
                  "group-data-[hover=true]:border-primary",
                  //selected
                  "group-data-[selected=true]:ml-6",
                  // pressed
                  "group-data-[pressed=true]:w-7",
                  "group-data-[selected]:group-data-[pressed]:ml-4",
                ),
              }}
            >
              <div className="flex flex-col gap-1">
                <p className="text-medium">显示状态</p>
                <p className="text-tiny text-default-400">
                  是否需要在首页以路由形式呈现，点击后跳转页面。
                </p>
              </div>
            </Switch>
            <Button
              isLoading={loading}
              color="primary"
              variant="shadow"
              onClick={() => submit()}
              aria-label="更新"
            >
              更新
            </Button>
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}