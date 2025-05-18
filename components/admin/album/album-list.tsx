'use client'

import React, { useState } from 'react'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import { ArrowDown10 } from 'lucide-react'
import { toast } from 'sonner'
import type { AlbumType } from '~/types'
import type { HandleProps } from '~/types/props'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { Card, CardFooter } from '~/components/ui/card'
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
import { useTranslations } from 'next-intl'
import { Badge } from '~/components/ui/badge'

export default function AlbumList(props : Readonly<HandleProps>) {
  const { data, mutate } = useSwrHydrated(props)
  const [album, setAlbum] = useState({} as AlbumType)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [updateAlbumLoading, setUpdateAlbumLoading] = useState(false)
  const [updateAlbumId, setUpdateAlbumId] = useState('')
  const { setAlbumEdit, setAlbumEditData } = useButtonStore(
    (state) => state,
  )
  const t = useTranslations()

  async function deleteAlbum() {
    setDeleteLoading(true)
    if (!album.id) return
    try {
      const res = await fetch(`/api/v1/albums/delete/${album.id}`, {
        method: 'DELETE',
      })
      if (res.status === 200) {
        toast.success(t('Tips.deleteSuccess'))
        await mutate()
      } else {
        toast.error(t('Tips.deleteFailed'))
      }
    } catch {
      toast.error(t('Tips.deleteFailed'))
    } finally {
      setDeleteLoading(false)
    }
  }

  async function updateAlbumShow(id: string, show: number) {
    try {
      setUpdateAlbumId(id)
      setUpdateAlbumLoading(true)
      const res = await fetch('/api/v1/albums/update-show', {
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
        toast.success(t('Tips.updateSuccess'))
        await mutate()
      } else {
        toast.error(t('Tips.updateFailed'))
      }
    } catch {
      toast.error(t('Tips.updateFailed'))
    } finally {
      setUpdateAlbumId('')
      setUpdateAlbumLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data && data.map((album: AlbumType) => (
        <Card key={album.id} className="flex flex-col h-72 show-up-motion items-center gap-0 py-0">
          <div className="flex h-12 justify-start w-full p-2 space-x-2">
            <Badge aria-label={t('Album.albumName')}>{album.name}</Badge>
            <Badge variant="secondary" aria-label={t('Album.router')}>{album.album_value}</Badge>
          </div>
          <div className="flex justify-start w-full p-2 h-48">
            {album.detail || t('Album.noTips')}
          </div>
          <CardFooter className="flex h-12 p-2 mb-1 space-x-1 select-none rounded-md before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 before:rounded-xl rounded-large w-[calc(100%_-_8px)] shadow-small z-10">
            <div className="flex flex-1 space-x-1 items-center">
              {
                updateAlbumLoading && updateAlbumId === album.id ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/> :
                  <Switch
                    checked={album.show === 0}
                    disabled={updateAlbumLoading}
                    className="cursor-pointer"
                    onCheckedChange={(isSelected: boolean) => updateAlbumShow(album.id, isSelected ? 0 : 1)}
                  />
              }
              <Badge variant="secondary" aria-label={t('Words.sort')}><ArrowDown10 size={18}/>{album.sort}</Badge>
            </div>
            <div className="space-x-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setAlbumEditData(album)
                  setAlbumEdit(true)
                }}
                aria-label={t('Album.editAlbum')}
              >
                <SquarePenIcon />
              </Button>
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
                    aria-label={t('Album.deleteAlbum')}
                  >
                    <DeleteIcon />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t('Tips.reallyDelete')}</DialogTitle>
                  </DialogHeader>
                  <div>
                    <p>{t('Album.albumId')}：{album.id}</p>
                    <p>{t('Album.albumName')}：{album.name}</p>
                    <p>{t('Album.albumRouter')}：{album.album_value}</p>
                  </div>
                  <DialogFooter>
                    <Button
                      className="cursor-pointer"
                      disabled={deleteLoading}
                      onClick={() => deleteAlbum()}
                      aria-label={t('Button.yesDelete')}
                    >
                      {deleteLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
                      {t('Button.delete')}
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