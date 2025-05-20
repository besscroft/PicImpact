'use client'

import React, { useState, useEffect } from 'react'
import type { ImageType, AlbumType } from '~/types'
import type { ImageListDataProps, ImageServerHandleProps } from '~/types/props'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import { useSwrPageTotalServerHook } from '~/hooks/use-swr-page-total-server-hook'
import { ArrowDown10, ScanSearch, Replace } from 'lucide-react'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'
import ImageEditSheet from '~/components/admin/list/image-edit-sheet'
import ImageView from '~/components/admin/list/image-view'
import { fetcher } from '~/lib/utils/fetcher'
import useSWR from 'swr'
import ListImage from '~/components/admin/list/list-image'
import ImageBatchDeleteSheet from '~/components/admin/list/image-batch-delete-sheet'
import { Button } from '~/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Card, CardContent, CardFooter } from '~/components/ui/card'
import { Switch } from '~/components/ui/switch'
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
import { useTranslations } from 'next-intl'
import { Badge } from '~/components/ui/badge'
import { ChevronLeftIcon } from '~/components/icons/chevron-left'
import { ChevronRightIcon } from '~/components/icons/chevron-right'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { RefreshCWIcon } from '~/components/icons/refresh-cw.tsx'
import { CircleChevronDownIcon } from '~/components/icons/circle-chevron-down.tsx'

export default function ListProps(props : Readonly<ImageServerHandleProps>) {
  const [pageNum, setPageNum] = useState(1)
  const [album, setAlbum] = useState('')
  const [showStatus, setShowStatus] = useState('')
  const [imageAlbum, setImageAlbum] = useState('')
  const [selectedCamera, setSelectedCamera] = useState('')
  const [selectedLens, setSelectedLens] = useState('')
  const [cameras, setCameras] = useState<string[]>([])
  const [lenses, setLenses] = useState<string[]>([])
  const { data, isLoading, mutate } = useSwrInfiniteServerHook(props, pageNum, album, showStatus === '' ? -1 : Number(showStatus), selectedCamera === '' ? '' : selectedCamera, selectedLens === '' ? '' : selectedLens)
  const { data: total, mutate: totalMutate } = useSwrPageTotalServerHook(props, album, showStatus === '' ? -1 : Number(showStatus), selectedCamera === '' ? '' : selectedCamera, selectedLens === '' ? '' : selectedLens)
  const [image, setImage] = useState({} as ImageType)
  const [updateShowLoading, setUpdateShowLoading] = useState(false)
  const [updateImageAlbumLoading, setUpdateImageAlbumLoading] = useState(false)
  const [updateShowId, setUpdateShowId] = useState('')
  const { setImageEdit, setImageEditData, setImageView, setImageViewData, setImageBatchDelete } = useButtonStore(
    (state) => state,
  )
  const { data: albums, isLoading: albumsLoading } = useSWR('/api/v1/albums/get', fetcher)
  const t = useTranslations()

  const dataProps: ImageListDataProps = {
    data: data,
  }

  useEffect(() => {
    const fetchCameraAndLensList = async () => {
      try {
        const response = await fetch('/api/v1/images/camera-lens-list')
        if (response.ok) {
          const data = await response.json()
          setCameras(data.cameras)
          setLenses(data.lenses)
        }
      } catch (error) {
        console.error('Failed to fetch camera and lens list:', error)
      }
    }

    fetchCameraAndLensList()
  }, [])

  async function updateImageShow(id: string, show: number) {
    try {
      setUpdateShowLoading(true)
      setUpdateShowId(id)
      const res = await fetch('/api/v1/images/update-show', {
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
    } catch {
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
      const res = await fetch('/api/v1/images/update-Album', {
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
    } catch {
      toast.error('更新失败！')
    } finally {
      setUpdateImageAlbumLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <div className="flex justify-between space-x-1">
        <div className="flex justify-between items-center space-x-2">
          <Select
            disabled={albumsLoading}
            onValueChange={async (value: string) => {
              setAlbum(value)
              setShowStatus('')
              await totalMutate()
              await mutate()
            }}
          >
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder={t('List.selectAlbum')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('Words.album')}</SelectLabel>
                <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                {albums?.map((album: AlbumType) => (
                  <SelectItem className="cursor-pointer" key={album.album_value} value={album.album_value}>
                    {album.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="hidden sm:flex items-center space-x-2">
            <Select
              value={showStatus}
              onValueChange={async (value: string) => {
                setShowStatus(value)
                await totalMutate()
                await mutate()
              }}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder={t('List.selectShowStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('Words.showStatus')}</SelectLabel>
                  <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                  <SelectItem className="cursor-pointer" value="0">{t('Words.public')}</SelectItem>
                  <SelectItem className="cursor-pointer" value="1">{t('Words.private')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={selectedCamera}
              onValueChange={async (value: string) => {
                setSelectedCamera(value)
                await totalMutate()
                await mutate()
              }}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder={t('List.selectCamera')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('Words.camera')}</SelectLabel>
                  <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                  {cameras.map((camera) => (
                    <SelectItem className="cursor-pointer" key={camera} value={camera}>
                      {camera}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={selectedLens}
              onValueChange={async (value: string) => {
                setSelectedLens(value)
                await totalMutate()
                await mutate()
              }}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder={t('List.selectLens')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('Words.lens')}</SelectLabel>
                  <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                  {lenses.map((lens) => (
                    <SelectItem className="cursor-pointer" key={lens} value={lens}>
                      {lens}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="icon"
            aria-label={t('Button.batchDelete')}
            onClick={() => setImageBatchDelete(true)}
          >
            <DeleteIcon />
          </Button>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="icon"
            disabled={isLoading}
            onClick={async () => {
              await totalMutate()
              await mutate()
            }}
            aria-label={t('Button.refresh')}
          >
            <RefreshCWIcon />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="flex sm:hidden cursor-pointer"
                variant="outline"
                size="icon"
              >
                <CircleChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="flex flex-col items-center space-y-1">
                <Select
                  value={showStatus}
                  onValueChange={async (value: string) => {
                    setShowStatus(value)
                    await totalMutate()
                    await mutate()
                  }}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder={t('List.selectShowStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t('Words.showStatus')}</SelectLabel>
                      <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                      <SelectItem className="cursor-pointer" value="0">{t('Words.public')}</SelectItem>
                      <SelectItem className="cursor-pointer" value="1">{t('Words.private')}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedCamera}
                  onValueChange={async (value: string) => {
                    setSelectedCamera(value)
                    await totalMutate()
                    await mutate()
                  }}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder={t('List.selectCamera')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t('Words.camera')}</SelectLabel>
                      <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                      {cameras.map((camera) => (
                        <SelectItem className="cursor-pointer" key={camera} value={camera}>
                          {camera}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedLens}
                  onValueChange={async (value: string) => {
                    setSelectedLens(value)
                    await totalMutate()
                    await mutate()
                  }}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder={t('List.selectLens')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t('Words.lens')}</SelectLabel>
                      <SelectItem className="cursor-pointer" value="all">{t('Words.all')}</SelectItem>
                      {lenses.map((lens) => (
                        <SelectItem className="cursor-pointer" key={lens} value={lens}>
                          {lens}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.isArray(data) && data?.map((image: ImageType) => (
          <Card key={image.id} className="flex flex-col h-72 show-up-motion items-center gap-0 py-0">
            <div className="flex h-12 justify-between w-full p-2 space-x-2">
              <Badge variant="secondary" aria-label={t('Words.album')}>{image.album_name}</Badge>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => {
                    setImageViewData(image)
                    setImageView(true)
                  }}
                  aria-label={t('List.viewImage')}
                >
                  <ScanSearch size={20} />
                </Button>
              </div>
            </div>
            <CardContent className="flex h-48 items-center justify-center w-full p-2 scrollbar-hide">
              <ListImage image={image} />
            </CardContent>
            <CardFooter
              className="flex h-12 p-2 mb-1 space-x-1 select-none rounded-md before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 before:rounded-xl rounded-large w-[calc(100%_-_8px)] shadow-small z-10">
              <div className="flex flex-1 space-x-1 items-center">
                {
                  updateShowLoading && updateShowId === image.id ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/> :
                  <Switch
                    checked={image.show === 0}
                    disabled={updateShowLoading}
                    className="cursor-pointer"
                    onCheckedChange={(isSelected: boolean) => updateImageShow(image.id, isSelected ? 0 : 1)}
                  />
                }
                <Badge variant="secondary" aria-label={t('Words.sort')}><ArrowDown10 size={18}/>{image.sort}</Badge>
              </div>
              <div className="space-x-1">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="cursor-pointer"
                      onClick={() => {
                        setImage(image)
                        setImageAlbum(image.album_value)
                      }}
                      aria-label={t('List.bindAlbum')}
                    >
                      <Replace size={20} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('List.bindAlbum')}</AlertDialogTitle>
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
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder={t('List.selectAlbum')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>{t('Words.album')}</SelectLabel>
                          {albums?.map((album: AlbumType) => (
                            <SelectItem className="cursor-pointer" key={album.id} value={album.id}>
                              {album.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer" onClick={() => {
                        setImage({} as ImageType)
                        setImageAlbum('')
                      }}>{t('Button.canal')}</AlertDialogCancel>
                      <AlertDialogAction
                        className="cursor-pointer"
                        disabled={updateImageAlbumLoading}
                        onClick={() => updateImageAlbum()}
                        aria-label={t('Button.update')}
                      >
                        {updateImageAlbumLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
                        {t('Button.update')}
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
                  aria-label={t('List.editImage')}
                >
                  <SquarePenIcon />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      {total !== 0 &&
        <div className="flex space-x-2">
          <Select
            value={pageNum.toString()}
            onValueChange={async (page: string) => {
              setPageNum(Number(page))
              await mutate()
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder={pageNum} />
            </SelectTrigger>
            <SelectContent side="top">
              {Array.from({ length: Math.ceil(total / 8) }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ChevronLeftIcon
            onClick={async () => {
              if (pageNum > 1) {
                setPageNum(pageNum - 1)
                await mutate()
              }
            }}
            size={18}
          />
          <ChevronRightIcon
            onClick={async () => {
              if (pageNum < Math.ceil(total / 8)) {
                setPageNum(pageNum + 1)
                await mutate()
              }
            }}
            size={18}
          />
        </div>
      }
      <ImageEditSheet {...{...props, pageNum, album}} />
      <ImageView />
      <ImageBatchDeleteSheet {...{...props, dataProps, pageNum, album}} />
    </div>
  )
}