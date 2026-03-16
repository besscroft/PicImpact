import { fetchAlbumsShow } from '~/server/db/query/albums'
import type { AlbumType } from '~/types'
import type { AlbumDataProps } from '~/types/props'
import TopNav from '~/components/layout/top-nav'

export default async function MapLayout({
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
      <TopNav {...props} />
      <main className="pt-14">{children}</main>
    </>
  )
}
