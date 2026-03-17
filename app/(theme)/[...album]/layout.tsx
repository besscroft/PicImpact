import { fetchAlbumsShow } from '~/server/db/query/albums'
import { fetchConfigsByKeys } from '~/server/db/query/configs'
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

  const getTitle = async () => {
    'use server'
    const configs = await fetchConfigsByKeys(['custom_title'])
    return configs?.find((item) => item.config_key === 'custom_title')?.config_value || 'PicImpact'
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
