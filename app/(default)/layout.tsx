import { fetchAlbumsShow } from '~/server/db/query/albums'
import type { AlbumType } from '~/types'
import type { AlbumDataProps } from '~/types/props'
import DockMenu from '~/components/layout/dock-menu'

export default async function DefaultLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const getData = async () => {
    'use server'
    return await fetchAlbumsShow()
  }

  const data: AlbumType[] = await getData()

  const props: AlbumDataProps = {
    data: data
  }

  return (
    <>
      <DockMenu {...props} />
      {children}
    </>
  )
}
