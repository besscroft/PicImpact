'use client'

import React, { useState } from 'react'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import { ArrowDown10 } from 'lucide-react'
import { toast } from 'sonner'
import { AlbumType, HandleProps } from '~/types'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import { Card, CardFooter } from '~/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Switch } from '~/components/ui/switch'
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
import { SquarePenIcon } from '~/components/icons/square-pen'
import { DeleteIcon } from '~/components/icons/delete'

export default function AlbumList(props : Readonly<HandleProps>) {
  const { data, isLoading, error, mutate } = useSWRHydrated(props)
  const [album, setAlbum] = useState({} as AlbumType)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [updateAlbumLoading, setUpdateAlbumLoading] = useState(false)
  const [updateAlbumId, setUpdateAlbumId] = useState('')
  const { setAlbumEdit, setAlbumEditData } = useButtonStore(
    (state) => state,
  )

  async function deleteAlbum() {
    setDeleteLoading(true)
    if (!album.id) return
    if (album.album_value === '/') {
      toast.warning('/ 路由不允许被删除！')
      return
    }
    try {
      const res = await fetch(`/api/v1/albums/delete/${album.id}`, {
        method: 'DELETE',
      })
      if (res.status === 200) {
        toast.success('删除成功！')
        await mutate()
      } else {
        toast.error('删除失败！')
      }
    } catch (e) {
      toast.error('删除失败！')
    } finally {
      setDeleteLoading(false)
    }
  }

  async function updateAlbumShow(id: string, album_value: string, show: number) {
    if (album_value === '/' && show === 1) {
      toast.warning('/ 路由不允许设置为不显示！')
      return
    }
    try {
      setUpdateAlbumId(id)
      setUpdateAlbumLoading(true)
      const res = await fetch(`/api/v1/albums/update-show`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          show
        }),
      })
      if (res.status === 200) {
        toast.success('更新成功！')
        await mutate()
      } else {
        toast.error('更新失败！')
      }
    } catch (e) {
      toast.error('更新失败！')
    } finally {
      setUpdateAlbumId('')
      setUpdateAlbumLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data && data.map((album: AlbumType) => (
        <Card key={album.id} className="flex flex-col h-72 show-up-motion items-center">
          <div className="flex h-12 justify-start w-full p-2 space-x-2">
            <p>{album.name}</p>
            <Popover>
              <PopoverTrigger
                className="cursor-pointer select-none inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                <p className="whitespace-nowrap text-sm" aria-label="路由">{album.album_value}</p>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-2 select-none">
                  <div className="text-small font-bold">路由</div>
                  <div className="text-tiny">可以访问的一级路径</div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex justify-start w-full p-2 h-48">
            {album.detail || '没有介绍'}
          </div>
          <CardFooter className="flex h-12 p-2 mb-1 space-x-1 select-none before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 before:rounded-xl rounded-large w-[calc(100%_-_8px)] shadow-small z-10">
            <div className="flex flex-1 space-x-1 items-center">
              {
                updateAlbumLoading && updateAlbumId === album.id ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/> :
                  <Switch
                    checked={album.show === 0}
                    disabled={updateAlbumLoading}
                    onCheckedChange={(isSelected: boolean) => updateAlbumShow(album.id, album.album_value, isSelected ? 0 : 1)}
                  />
              }
              <Popover>
                <PopoverTrigger className="cursor-pointer select-none inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                  <div className="flex space-x-2 items-center justify-center text-sm"><ArrowDown10 size={20}/>{album.sort}</div>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="px-1 py-2 select-none">
                    <div className="text-small font-bold">排序</div>
                    <div className="text-tiny">首页优先级最高</div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-x-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setAlbumEditData(album)
                  setAlbumEdit(true)
                }}
                aria-label="编辑相册"
              >
                <SquarePenIcon />
              </Button>
              {
                album.album_value !== '/' &&
                <Dialog onOpenChange={(value) => {
                  if (!value) {
                    setAlbum({} as AlbumType)
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setAlbum(album)
                      }}
                      aria-label="删除相册"
                    >
                      <DeleteIcon />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>确定要删掉？</DialogTitle>
                    </DialogHeader>
                    <div>
                      <p>相册 ID：{album.id}</p>
                      <p>相册名称：{album.name}</p>
                      <p>相册路由：{album.album_value}</p>
                    </div>
                    <DialogFooter>
                      <Button
                        disabled={deleteLoading}
                        onClick={() => deleteAlbum()}
                        aria-label="确认删除"
                      >
                        {deleteLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
                        删除
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              }
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}