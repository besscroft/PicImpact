'use client'

import React, { useState } from 'react'
import { DataProps, ImageServerHandleProps, ImageType, AlbumType } from '~/types'
import { useSWRInfiniteServerHook } from '~/hooks/useSWRInfiniteServerHook'
import { useSWRPageTotalServerHook } from '~/hooks/useSWRPageTotalServerHook'
import { ConfigProvider, Pagination } from 'antd'
import { ArrowDown10, ScanSearch, Replace } from 'lucide-react'
import { CircleHelpIcon } from '~/components/icons/circle-help'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-Providers'
import ImageEditSheet from '~/components/admin/list/ImageEditSheet'
import ImageView from '~/components/admin/list/ImageView'
import { fetcher } from '~/lib/utils/fetcher'
import useSWR from 'swr'
import ImageHelpSheet from '~/components/admin/list/ImageHelpSheet'
import ListImage from '~/components/admin/list/ListImage'
import ImageBatchDeleteSheet from '~/components/admin/list/ImageBatchDeleteSheet'
import { Button } from '~/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
import { Switch } from '~/components/ui/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { SquarePenIcon } from '~/components/icons/square-pen'
import { DeleteIcon } from '~/components/icons/delete'

export default function ListProps(props : Readonly<ImageServerHandleProps>) {
  const [pageNum, setPageNum] = useState(1)
  const [album, setAlbum] = useState('')
  const [imageAlbum, setImageAlbum] = useState('')
  const { data, isLoading, mutate } = useSWRInfiniteServerHook(props, pageNum, album)
  const { data: total, mutate: totalMutate } = useSWRPageTotalServerHook(props, album)
  const [image, setImage] = useState({} as ImageType)
  const [updateShowLoading, setUpdateShowLoading] = useState(false)
  const [updateImageAlbumLoading, setUpdateImageAlbumLoading] = useState(false)
  const [updateShowId, setUpdateShowId] = useState('')
  const { setImageEdit, setImageEditData, setImageView, setImageViewData, setImageHelp, setImageBatchDelete } = useButtonStore(
    (state) => state,
  )
  const { data: albums, isLoading: albumsLoading } = useSWR('/api/v1/albums/get', fetcher)

  const dataProps: DataProps = {
    data: data,
  }

  async function updateImageShow(id: string, show: number) {
    try {
      setUpdateShowLoading(true)
      setUpdateShowId(id)
      const res = await fetch(`/api/v1/images/update-show`, {
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
      setUpdateShowId('')
      setUpdateShowLoading(false)
    }
  }

  async function updateImageAlbum() {
    if (!imageAlbum) {
      toast.error('图片绑定的相册不能为空！')
      return
    }
    try {
      setUpdateImageAlbumLoading(true)
      const res = await fetch(`/api/v1/images/update-Album`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: image.id,
          albumId: imageAlbum
        }),
      })
      if (res.status === 200) {
        toast.success('更新成功！')
        setImageAlbum('')
        setImage({} as ImageType)
        await mutate()
      } else {
        toast.error('更新失败！')
      }
    } catch (e) {
      toast.error('更新失败！')
    } finally {
      setUpdateImageAlbumLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <div className="flex justify-between space-x-1">
        <div className="flex items-center justify-center w-full sm:w-64 md:w-80">
          <Select
            disabled={albumsLoading}
            onValueChange={async (value: string) => {
              setAlbum(value)
              await totalMutate()
              await mutate()
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择相册" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>相册</SelectLabel>
                <SelectItem value="all">全部</SelectItem>
                {albums?.map((album: AlbumType) => (
                  <SelectItem key={album.album_value} value={album.album_value}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="帮助"
            onClick={() => setImageHelp(true)}
          >
            <CircleHelpIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="批量删除"
            onClick={() => setImageBatchDelete(true)}
          >
            <DeleteIcon />
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            disabled={isLoading}
            onClick={async () => {
              await totalMutate()
              await mutate()
            }}
            aria-label="刷新"
          >
            {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
            刷新
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.isArray(data) && data?.map((image: ImageType) => (
          <Card key={image.id} className="flex flex-col h-72 show-up-motion items-center">
            <div className="flex h-12 justify-between w-full p-2 space-x-2">
              <Popover>
                <PopoverTrigger className="cursor-pointer select-none inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                  <div className="flex space-x-2 items-center justify-center text-sm">{image.album_name}</div>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="px-1 py-2 select-none">
                    <div className="text-small font-bold">相册</div>
                    <div className="text-tiny">图片在对应的相册上显示</div>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setImageViewData(image)
                    setImageView(true)
                  }}
                  aria-label="查看图片"
                >
                  <ScanSearch size={20} />
                </Button>
              </div>
            </div>
            <CardContent className="flex h-48 items-center justify-center w-full p-2 scrollbar-hide">
              <ListImage image={image} />
            </CardContent>
            <CardFooter
              className="flex h-12 p-2 mb-1 space-x-1 select-none before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 before:rounded-xl rounded-large w-[calc(100%_-_8px)] shadow-small z-10">
              <div className="flex flex-1 space-x-1 items-center">
                {
                  updateShowLoading && updateShowId === image.id ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/> :
                  <Switch
                    checked={image.show === 0}
                    disabled={updateShowLoading}
                    onCheckedChange={(isSelected: boolean) => updateImageShow(image.id, isSelected ? 0 : 1)}
                  />
                }
                <Popover>
                  <PopoverTrigger className="cursor-pointer select-none inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-emerald-700">
                    <div className="flex space-x-2 items-center justify-center text-sm"><ArrowDown10 size={20}/>{image.sort}</div>
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setImage(image)
                        setImageAlbum(image.album_value)
                      }}
                      aria-label="绑定相册"
                    >
                      <Replace size={20} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>相册绑定</AlertDialogTitle>
                    </AlertDialogHeader>
                    <Select
                      defaultValue={imageAlbum}
                      disabled={isLoading}
                      onValueChange={async (value: string) => {
                        setImageAlbum(value)
                        await totalMutate()
                        await mutate()
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="请选择相册" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>相册</SelectLabel>
                          {albums?.map((album: AlbumType) => (
                            <SelectItem key={album.id} value={album.id}>
                              {album.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => {
                        setImage({} as ImageType)
                        setImageAlbum('')
                      }}>取消</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={updateImageAlbumLoading}
                        onClick={() => updateImageAlbum()}
                        aria-label="更新"
                      >
                        {updateImageAlbumLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
                        更新
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setImageEditData(image)
                    setImageEdit(true)
                  }}
                  aria-label="编辑图片"
                >
                  <SquarePenIcon />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      <ConfigProvider
        theme={{
          "token": {
            "colorTextBase": "#13c2c2"
          }
        }}
      >
        <Pagination
          defaultCurrent={1}
          current={pageNum}
          total={total}
          pageSize={8}
          hideOnSinglePage
          showSizeChanger={false}
          onChange={async (page, pageSize) => {
            setPageNum(page)
            await mutate()
          }}
        />
      </ConfigProvider>
      <ImageEditSheet {...{...props, pageNum, album}} />
      <ImageView />
      <ImageHelpSheet />
      <ImageBatchDeleteSheet {...{...props, dataProps, pageNum, album}} />
    </div>
  )
}