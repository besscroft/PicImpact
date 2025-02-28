import Logo from '~/components/layout/Logo'
import DynamicNavbar from '~/components/layout/DynamicNavbar'
import HeaderLink from '~/components/layout/HeaderLink'
import { fetchAlbumsShow,fetchAlbumsShowOptions } from '~/server/db/query'
import { AlbumDataProps } from '~/types'

export default async function Header() {
  const getData = async () => {
    'use server'
    return await fetchAlbumsShow()
  }

  const getCustomFoldAlbumEnable = async () => {
    'use server'
    return await fetchAlbumsShowOptions()
  }

  const data = await getData()
  const customFoldAlbumEnable = await getCustomFoldAlbumEnable()

  const props: AlbumDataProps = {
    data: data,
    customFoldAlbumEnable: customFoldAlbumEnable.enabled,
    customFoldAlbumCount: customFoldAlbumEnable.count
  }

  return (
    <div className="flex items-center w-full p-2 sm:px-8 md:px-16 lg:px-32">
      <div className="justify-start">
        <Logo/>
      </div>
      <div className="hidden sm:flex gap-1 flex-1 select-none justify-center w-full">
        <HeaderLink {...props} />
      </div>
      <div className="flex sm:hidden flex-1"></div>
      <div className="flex h-full items-center space-x-2 justify-end">
        <DynamicNavbar/>
      </div>
    </div>
  );
}