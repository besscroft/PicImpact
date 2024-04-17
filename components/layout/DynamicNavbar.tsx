import VaulDrawer from '~/components/layout/VaulDrawer'
import { DropMenu } from '~/components/layout/DropMenu'

export default function DynamicNavbar() {
  return (
    <>
      <div className="flex sm:hidden">
        <VaulDrawer/>
      </div>
      <div className="hidden sm:flex space-x-2">
        <DropMenu/>
      </div>
    </>
  )
}