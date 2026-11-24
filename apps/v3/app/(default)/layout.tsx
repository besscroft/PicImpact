import { cachedAlbumsShow, cachedConfigsByKeys } from '~/server/lib/cache'
import { toCustomInfo } from '~/server/lib/config-transform'
import type { AlbumType } from '~/types'
import type { AlbumDataProps } from '~/types/props'
import TopNav from '~/components/layout/top-nav'
import { PageTransition } from '~/components/layout/page-transition'

export default async function DefaultLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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

  const data: AlbumType[] = await getData()
  const title = await getTitle()

  const props: AlbumDataProps = {
    data: data,
    title: title
  }

  return (
    <>
      <TopNav {...props} />
      <main id="main-content" className="pt-14">
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  )
}
