import { fetchAlbumsShow } from '~/server/db/query/albums'
import type { AlbumType } from '~/types'
import type { AlbumDataProps } from '~/types/props'
import TopNav from '~/components/layout/top-nav'

export default async function ThemeAlbumLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ album: string }>
}>) {
  const getData = async () => {
    'use server'
    return await fetchAlbumsShow()
  }

  const dataList: AlbumType[] = await getData()
  const props: AlbumDataProps = {
    data: dataList
  }

  return (
    <>
      <TopNav {...props} />
      <main className="pt-14">{children}</main>
    </>
  )
}
