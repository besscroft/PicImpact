'use client'

import React, { useState } from 'react'
import { HandleProps, CopyrightType } from '~/types'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Switch } from '~/components/ui/switch'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Card, CardFooter } from '~/components/ui/card'
import { SquarePenIcon } from '~/components/icons/square-pen'
import { DeleteIcon } from '~/components/icons/delete'

export default function CopyrightList(props : Readonly<HandleProps>) {
  const { data, isLoading, error, mutate } = useSWRHydrated(props)
  const [copyright, setCopyright] = useState({} as CopyrightType)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [updateCopyrightLoading, setUpdateCopyrightLoading] = useState(false)
  const [updateCopyrightId, setUpdateCopyrightId] = useState('')
  const { setCopyrightEdit, setCopyrightEditData } = useButtonStore(
    (state) => state,
  )

  async function deleteCopyright() {
    setDeleteLoading(true)
    if (!copyright.id) return
    try {
      const res = await fetch(`/api/v1/copyrights/delete/${copyright.id}`, {
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

  async function updateCopyrightShow(id: string, show: number) {
    try {
      setUpdateCopyrightId(id)
      setUpdateCopyrightLoading(true)
      const res = await fetch(`/api/v1/copyrights/update-show`, {
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
      setUpdateCopyrightId('')
      setUpdateCopyrightLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data && data.map((copyright: CopyrightType) => (
        <Card key={copyright.id} className="flex flex-col h-72 show-up-motion items-center">
          <div className="flex h-12 justify-start w-full p-2 space-x-2">
            <p>{copyright.name}</p>
            <Popover>
              <PopoverTrigger className="cursor-pointer select-none inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                <p className="whitespace-nowrap text-sm">{copyright.type === 'social' ? '社交媒体' : '外链'}</p>
              </PopoverTrigger>
              <PopoverContent>
                <div className="px-1 py-2 select-none">
                  <div className="text-small font-bold">类型</div>
                  <div className="text-tiny">版权声明类型</div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex justify-start w-full p-2 h-48">{copyright.detail || 'N&A'}</div>
          <CardFooter className="flex h-12 p-2 mb-1 space-x-1 select-none before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 before:rounded-xl rounded-large w-[calc(100%_-_8px)] shadow-small z-10">
            <div className="flex flex-1 space-x-1 items-center w-full">
              {
                updateCopyrightLoading && updateCopyrightId === copyright.id ?
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/> :
                <Switch
                  checked={copyright.show === 0}
                  disabled={updateCopyrightLoading}
                  onCheckedChange={(isSelected: boolean) => updateCopyrightShow(copyright.id, isSelected ? 0 : 1)}
                />
              }
              {
                copyright.default === 0 &&
                <span className="inline-flex items-center justify-center rounded-full border border-emerald-500 px-2.5 py-0.5 text-emerald-700">
                  <p className="whitespace-nowrap text-sm">默认</p>
                </span>
              }
            </div>
            <div className="space-x-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setCopyrightEditData(copyright)
                  setCopyrightEdit(true)
                }}
                aria-label="编辑版权"
              >
                <SquarePenIcon />
              </Button>
              <Dialog onOpenChange={(value) => {
                if (!value) {
                  setCopyright({} as CopyrightType)
                }
              }}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setCopyright(copyright)
                    }}
                    aria-label="删除版权"
                  >
                    <DeleteIcon />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>确定要删掉？</DialogTitle>
                  </DialogHeader>
                  <div>
                    <p>版权 ID：{copyright.id}</p>
                    <p>版权名称：{copyright.name}</p>
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={deleteLoading}
                      onClick={() => deleteCopyright()}
                      aria-label="确认删除"
                    >
                      {deleteLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
                      删除
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}