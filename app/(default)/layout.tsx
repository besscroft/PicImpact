import { fetchAlbumsShow } from '~/server/db/query/albums'
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
    return await fetchAlbumsShow()
  }

  const data: AlbumType[] = await getData()

  const props: AlbumDataProps = {
    data: data
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
