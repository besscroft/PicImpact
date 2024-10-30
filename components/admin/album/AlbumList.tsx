'use client'

import React, { useState } from 'react'
import { HandleProps } from '~/types'
import { useSWRHydrated } from '~/hooks/useSWRHydrated'
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Chip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
  Spinner,
  Tooltip,
} from '@nextui-org/react'
import { ArrowDown10, Eye, EyeOff, Pencil, Trash } from 'lucide-react'
import { toast } from 'sonner'
import DefaultAlbum from '~/components/admin/album/DefaultAlbum'
import { AlbumType } from '~/types'
import { useButtonStore } from '~/app/providers/button-store-Providers'

export default function AlbumList(props : Readonly<HandleProps>) {
  const { data, isLoading, error, mutate } = useSWRHydrated(props)
  const [isOpen, setIsOpen] = useState(false)
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
    try {
      const res = await fetch(`/api/v1/albums/delete/${album.id}`, {
        method: 'DELETE',
      })
      if (res.status === 200) {
        toast.success('删除成功！')
        setIsOpen(false)
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

  async function updateAlbumShow(id: string, show: number) {
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <DefaultAlbum/>
        {data && data.map((album: AlbumType) => (
          <Card key={album.id} shadow="sm" isFooterBlurred className="h-64 show-up-motion">
            <CardHeader className="flex gap-3">
              <p>{album.name}</p>
              <Popover placement="top" shadow="sm">
                <PopoverTrigger className="cursor-pointer">
                  <Chip className="select-none" color="success" variant="shadow" aria-label="路由">{album.album_value}</Chip>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="px-1 py-2 select-none">
                    <div className="text-small font-bold">路由</div>
                    <div className="text-tiny">可以访问的一级路径</div>
                  </div>
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardBody>
              <p>{album.detail || '没有介绍'}</p>
            </CardBody>
            <CardFooter className="flex space-x-1 select-none before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
              <div className="flex flex-1 space-x-1 items-center">
                {updateAlbumLoading && updateAlbumId === album.id ? <Spinner size="sm" /> :
                  <Switch
                    defaultSelected
                    size="sm"
                    color="success"
                    isSelected={album.show === 0}
                    isDisabled={updateAlbumLoading}
                    thumbIcon={({ isSelected }) =>
                      isSelected ? (
                        <Eye size={20} />
                      ) : (
                        <EyeOff className="dark:bg-zinc-700" size={20} />
                      )
                    }
                    onValueChange={(isSelected: boolean) => updateAlbumShow(album.id, isSelected ? 0 : 1)}
                  />
                }
                <Popover placement="top" shadow="sm">
                  <PopoverTrigger className="cursor-pointer">
                    <Chip
                      color="primary"
                      variant="shadow"
                      startContent={<ArrowDown10 size={20} />}
                      aria-label="排序"
                    >{album.sort}</Chip>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="px-1 py-2 select-none">
                      <div className="text-small font-bold">排序</div>
                      <div className="text-tiny">规则为从高到低</div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-x-1">
                <Tooltip content="编辑相册">
                  <Button
                    isIconOnly
                    size="sm"
                    onClick={() => {
                      setAlbumEditData(album)
                      setAlbumEdit(true)
                    }}
                    aria-label="编辑相册"
                  >
                    <Pencil size={20} />
                  </Button>
                </Tooltip>
                <Tooltip content="删除相册">
                  <Button
                    isIconOnly
                    size="sm"
                    onClick={() => {
                      setAlbum(album)
                      setIsOpen(true)
                    }}
                    aria-label="删除相册"
                  >
                    <Trash size={20} />
                  </Button>
                </Tooltip>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Modal
        isOpen={isOpen}
        hideCloseButton
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">确定要删掉？</ModalHeader>
          <ModalBody>
            <p>相册 ID：{album.id}</p>
            <p>相册名称：{album.name}</p>
            <p>相册路由：{album.album_value}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              variant="flat"
              onClick={() => {
                setAlbum({} as AlbumType)
                setIsOpen(false)
              }}
              aria-label="不删除"
            >
              算了
            </Button>
            <Button
              color="danger"
              isLoading={deleteLoading}
              onClick={() => deleteAlbum()}
              aria-label="确认删除"
            >
              是的
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}