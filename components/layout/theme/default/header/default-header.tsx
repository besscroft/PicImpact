import Logo from '~/components/layout/logo.tsx'
import type { AlbumDataProps } from '~/types/props.ts'
import HeaderIconGroup from '~/components/layout/header-icon-group.tsx'

export default async function DefaultHeader(props: Readonly<AlbumDataProps>) {
  return (
    <div className="flex items-center w-full p-2 sm:w-[66.667%] mx-auto sticky top-0 z-50 bg-white dark:bg-black">
      <div className="justify-start">
        <Logo/>
      </div>
      <div className="flex gap-1 flex-1 select-none justify-center w-full">
      </div>
      <div className="flex h-full items-center space-x-2 justify-end">
        <HeaderIconGroup {...props} />
      </div>
    </div>
  )
}