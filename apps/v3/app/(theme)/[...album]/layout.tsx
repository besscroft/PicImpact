import { cachedAlbumsShow, cachedConfigsByKeys } from '~/server/lib/cache'
import { toCustomInfo } from '~/server/lib/config-transform'
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
    return await cachedAlbumsShow()
  }

  const getTitle = async () => {
    'use server'
    const rows = await cachedConfigsByKeys(['custom_title'])
    return toCustomInfo(rows).customTitle || 'PicImpact'
  }

  const dataList: AlbumType[] = await getData()
  const title = await getTitle()
  const props: AlbumDataProps = {
    data: dataList,
    title: title
  }

  return (
    <>
      <TopNav {...props} />
      <main className="pt-14">{children}</main>
    </>
  )
}
