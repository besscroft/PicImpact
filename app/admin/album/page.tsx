import { fetchAlbumsList } from '~/server/db/query'
import AlbumList from '~/components/admin/album/AlbumList'
import RefreshButton from '~/components/album/RefreshButton'
import { HandleProps } from '~/types'
import React from 'react'
import AlbumAddSheet from '~/components/admin/album/AlbumAddSheet'
import AlbumAddButton from '~/components/admin/album/AlbumAddButton'
import AlbumEditSheet from '~/components/admin/album/AlbumEditSheet'
import AlbumHelpSheet from '~/components/admin/album/AlbumHelpSheet'
import AlbumHelp from '~/components/admin/album/AlbumHelp'

export default async function List() {

  const getData = async () => {
    'use server'
    return await fetchAlbumsList()
  }

  const props: HandleProps = {
    handle: getData,
    args: 'getAlbums',
  }

  return (
    <div className="flex flex-col space-y-2 h-full flex-1">
      <div className="flex justify-between">
        <div className="flex gap-5">
          <div className="flex flex-col gap-1 items-start justify-center">
            <h4 className="text-small font-semibold leading-none text-default-600 select-none">相册管理</h4>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <AlbumHelp />
          <AlbumAddButton />
          <RefreshButton {...props} />
        </div>
      </div>
      <AlbumList {...props} />
      <AlbumAddSheet {...props} />
      <AlbumEditSheet {...props} />
      <AlbumHelpSheet />
    </div>
  )
}