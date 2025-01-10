import VaulDrawer from '~/components/layout/VaulDrawer'
import { DropMenu } from '~/components/layout/DropMenu'
import { fetchAlbumsShow } from '~/server/db/query'
import { DataProps } from '~/types'
import Language from '~/components/layout/Language.tsx'

export default async function DynamicNavbar() {
  const getData = async () => {
    'use server'
    return await fetchAlbumsShow()
  }

  const data = await getData()

  const props: DataProps = {
    data: data
  }

  return (
    <>
      <div className="flex space-x-2 sm:hidden">
        <Language />
        <VaulDrawer {...props} />
      </div>
      <div className="hidden sm:flex space-x-2">
        <DropMenu/>
      </div>
    </>
  )
}