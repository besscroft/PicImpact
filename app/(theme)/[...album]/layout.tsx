import DefaultHeader from '~/components/layout/theme/default/header/default-header.tsx'
import { fetchAlbumByRouter, fetchAlbumsShow } from '~/server/db/query/albums'
import type { AlbumType } from '~/types'
import type { AlbumDataProps } from '~/types/props'
import SimpleHeader from '~/components/layout/theme/simple/header/simple-header.tsx'

export default async function ThemeAlbumLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ album: string }>
}>) {
  const { album } = await params
  // const routerUrl = '/' + album.join('')
  const getAlbum = async (album: string) => {
    'use server'
    return await fetchAlbumByRouter(album)
  }

  const getData = async () => {
    'use server'
    return await fetchAlbumsShow()
  }

  const dataList: AlbumType[] = await getData()
  const data: AlbumType = await getAlbum(`/${album}`)
  const props: AlbumDataProps = {
    data: dataList
  }

  return (
    <>
      {data
      && data.theme === '1' ? <SimpleHeader {...props} />
        : <DefaultHeader {...props} />
      }
      {children}
    </>
  )
}
