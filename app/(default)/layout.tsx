import DefaultHeader from '~/components/layout/theme/default/header/default-header.tsx'
import { fetchAlbumsShow } from '~/server/db/query/albums'
import type {AlbumType, Config} from '~/types'
import type { AlbumDataProps } from '~/types/props'
import { fetchConfigsByKeys } from '~/server/db/query/configs.ts'
import SimpleHeader from '~/components/layout/theme/simple/header/simple-header.tsx'

export default async function DefaultLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const getData = async () => {
    'use server'
    return await fetchAlbumsShow()
  }

  const getStyleConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_style',
    ])
  }

  const style: Config[] = await getStyleConfig()
  const currentStyle = style.find(a => a.config_key === 'custom_index_style')?.config_value

  const data: AlbumType[] = await getData()

  const props: AlbumDataProps = {
    data: data
  }

  return (
    <>
      {currentStyle
      && currentStyle === '1' ? <SimpleHeader {...props} />
        : <DefaultHeader {...props} />
      }
      {children}
    </>
  )
}
