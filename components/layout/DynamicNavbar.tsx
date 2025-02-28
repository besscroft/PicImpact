import VaulDrawer from '~/components/layout/VaulDrawer'
import { DropMenu } from '~/components/layout/DropMenu'
import { fetchAlbumsShow } from '~/server/db/query'
import { AlbumListProps } from '~/types'
import AlbumDrawer from '~/components/layout/AlbumDrawer'

export default async function DynamicNavbar() {
  const getData = async () => {
    'use server'
    return await fetchAlbumsShow()
  }

  const data = await getData()

  const props: AlbumListProps = {
    data: data
  }

  return (
    <>
      <div className="flex space-x-2 sm:hidden">
        <AlbumDrawer {...props} />
        <VaulDrawer />
      </div>
      <div className="hidden sm:flex space-x-2">
        <DropMenu/>
      </div>
    </>
  )
}