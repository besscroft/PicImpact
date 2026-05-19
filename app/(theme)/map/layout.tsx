import { fetchAlbumsShow } from '~/server/db/query/albums'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
import { toCustomInfo } from '~/server/lib/config-transform'
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

  const getTitle = async () => {
    'use server'
    const rows = await fetchConfigsByKeys(['custom_title'])
    return toCustomInfo(rows).customTitle || 'PicImpact'
  }

  const data: AlbumType[] = await getData()
  const title = await getTitle()

  const props: AlbumDataProps = {
    data: data,
    title: title
  }

  return (
    <>
      <TopNav {...props} />
      <main className="overflow-hidden pt-12">{children}</main>
    </>
  )
}
